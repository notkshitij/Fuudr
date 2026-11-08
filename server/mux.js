import { Buffer } from 'node:buffer';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

export const getMuxAdmin = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl() || !key) throw new Error('Mux upload database access is not configured.');
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const getPartner = async (authorization) => {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return { status: 401, error: 'Please sign in again before managing videos.' };

  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const supabase = createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { status: 401, error: 'Please sign in again before managing videos.' };
  const { data: partner, error } = await supabase.rpc('get_my_partner').maybeSingle();
  if (error) throw error;
  if (!partner?.id) return { status: 403, error: 'A partner profile is required to manage videos.' };
  return { partnerId: partner.id };
};

export const muxRequest = async (path, { method = 'GET', body } = {}) => {
  const { MUX_TOKEN_ID: id, MUX_TOKEN_SECRET: secret } = process.env;
  if (!id || !secret) throw new Error('Mux API credentials are not configured.');
  const response = await fetch(`https://api.mux.com/video/v1${path}`, {
    method,
    signal: AbortSignal.timeout(7000),
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body && JSON.stringify(body),
  });
  if (!response.ok) {
    const error = new Error(`Mux ${method} ${path.split('/')[1]} request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return (await response.json()).data;
};

export const isUploadId = value => typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const isMuxId = value => typeof value === 'string' && /^[a-z0-9]{1,128}$/i.test(value);

export async function recordMuxResult(admin, uploadId, asset, assetStatus) {
  const playbackId = asset?.playback_ids?.find(playback => playback.policy === 'public')?.id;
  const ready = assetStatus === 'ready' && isMuxId(playbackId);
  // Both the webhook and the status endpoint can observe the same result.
  const { data, error } = await admin.from('mux_reel_uploads')
    .update({
      status: ready ? 'ready' : 'errored',
      asset_id: asset?.id ?? null,
      playback_id: ready ? playbackId : null,
    })
    .eq('id', uploadId)
    .eq('status', 'processing')
    .select('asset_id, playback_id, status')
    .maybeSingle();
  if (error) throw error;
  return data;
}
