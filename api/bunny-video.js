import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const BUNNY_API_BASE = 'https://video.bunnycdn.com';

const getConfig = () => {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;

  if (!libraryId || !apiKey || !cdnHostname) {
    throw new Error('Bunny Stream server configuration is incomplete.');
  }

  return {
    libraryId: String(libraryId),
    apiKey,
    cdnHostname: cdnHostname.replace(/^https?:\/\//, '').replace(/\/$/, ''),
  };
};

const getAuthenticatedContext = async (req) => {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!token || !supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : { user: data.user, supabase };
};

const createUploadToken = (userId, videoId, expires, apiKey) => {
  const digest = crypto
    .createHmac('sha256', apiKey)
    .update(`${userId}:${videoId}:${expires}`)
    .digest('hex');
  return `${expires}.${digest}`;
};

const isValidUploadToken = (token, userId, videoId, apiKey) => {
  const [expiresText, suppliedDigest] = String(token || '').split('.');
  const expires = Number(expiresText);
  if (!expires || expires < Math.floor(Date.now() / 1000) || !/^[a-f0-9]{64}$/i.test(suppliedDigest || '')) return false;
  const expected = createUploadToken(userId, videoId, expires, apiKey).split('.')[1];
  return crypto.timingSafeEqual(Buffer.from(suppliedDigest, 'hex'), Buffer.from(expected, 'hex'));
};

const bunnyRequest = async (path, options = {}) => {
  const { apiKey } = getConfig();
  const response = await fetch(`${BUNNY_API_BASE}${path}`, {
    ...options,
    headers: {
      AccessKey: apiKey,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Bunny Stream request failed (${response.status}): ${detail || response.statusText}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

export default async function handler(req, res) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) return res.status(401).json({ error: 'Authentication required.' });
    const { user, supabase } = auth;

    const { libraryId, apiKey, cdnHostname } = getConfig();

    if (req.method === 'POST') {
      const title = typeof req.body?.title === 'string' && req.body.title.trim()
        ? req.body.title.trim().slice(0, 200)
        : `fuudr-${Date.now()}`;

      const video = await bunnyRequest(`/library/${libraryId}/videos`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      const videoId = video.guid;
      const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 2;
      const signature = crypto
        .createHash('sha256')
        .update(`${libraryId}${apiKey}${expires}${videoId}`)
        .digest('hex');

      return res.status(201).json({
        videoId,
        libraryId,
        expires,
        signature,
        uploadEndpoint: 'https://video.bunnycdn.com/tusupload',
        playbackUrl: `https://${cdnHostname}/${videoId}/playlist.m3u8`,
        thumbnailUrl: `https://${cdnHostname}/${videoId}/thumbnail.jpg`,
        uploadToken: createUploadToken(user.id, videoId, expires, apiKey),
      });
    }

    const videoId = typeof req.query?.videoId === 'string' ? req.query.videoId : '';
    if (!/^[0-9a-f-]{36}$/i.test(videoId)) {
      return res.status(400).json({ error: 'A valid Bunny video ID is required.' });
    }

    const hasTemporaryAccess = isValidUploadToken(req.query?.uploadToken, user.id, videoId, apiKey);
    if (!hasTemporaryAccess) {
      // `reels.partner_id` is the partner profile ID, which is not necessarily
      // the Supabase Auth user ID. Let the request JWT/RLS decide whether this
      // signed-in user may access the reel instead of comparing those IDs.
      const { data: ownedReel, error: ownershipError } = await supabase
        .from('reels')
        .select('id')
        .eq('provider_video_id', videoId)
        .maybeSingle();
      if (ownershipError) throw ownershipError;
      if (!ownedReel) return res.status(403).json({ error: 'You do not have access to this video.' });
    }

    if (req.method === 'GET') {
      const video = await bunnyRequest(`/library/${libraryId}/videos/${videoId}`);
      return res.status(200).json({
        videoId,
        status: video.status,
        encodeProgress: video.encodeProgress,
        playable: video.status === 3 || video.status === 4,
        failed: video.status === 5 || video.status === 8,
        transcodingMessages: (video.transcodingMessages || [])
          .map(({ message, value }) => [message, value].filter(Boolean).join(': '))
          .filter(Boolean),
      });
    }

    if (req.method === 'DELETE') {
      await bunnyRequest(`/library/${libraryId}/videos/${videoId}`, { method: 'DELETE' });
      return res.status(204).end();
    }

    res.setHeader('Allow', 'POST, GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('Bunny Stream API error:', error);
    return res.status(500).json({ error: error.message || 'Bunny Stream request failed.' });
  }
}
