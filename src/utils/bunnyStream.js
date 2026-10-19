import * as tus from 'tus-js-client';
import { supabase } from '../supabaseClient';
import { compressVideoForBunny } from './videoCompression';

const authenticatedFetch = async (url, options = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in again before uploading videos.');

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });
};

const readJson = async (response) => {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Video request failed (${response.status}).`);
  return body;
};

const waitForPlayable = async (videoId, uploadToken, onProgress, attempts = 60) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const params = new URLSearchParams({ videoId, uploadToken });
    const response = await authenticatedFetch(`/api/bunny-video?${params}`);
    const status = await readJson(response);
    onProgress?.(status.encodeProgress || 0);
    if (status.playable) return status;
    if (status.failed) {
      const details = status.transcodingMessages?.join(' ') || 'Try a different video file.';
      throw new Error(`Bunny could not process this video. ${details}`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('The video uploaded but is still processing. Please try saving again shortly.');
};

export const uploadVideoToBunny = async (file, { onCompressionProgress, onUploadProgress, onProcessingProgress } = {}) => {
  const optimizedFile = await compressVideoForBunny(file, onCompressionProgress);
  const createResponse = await authenticatedFetch('/api/bunny-video', {
    method: 'POST',
    body: JSON.stringify({ title: optimizedFile.name }),
  });
  const authorization = await readJson(createResponse);

  try {
    await new Promise((resolve, reject) => {
      const upload = new tus.Upload(optimizedFile, {
        endpoint: authorization.uploadEndpoint,
        retryDelays: [0, 1000, 3000, 5000, 10000],
        headers: {
          AuthorizationSignature: authorization.signature,
          AuthorizationExpire: String(authorization.expires),
          VideoId: authorization.videoId,
          LibraryId: authorization.libraryId,
        },
        metadata: {
          filename: optimizedFile.name,
          filetype: optimizedFile.type || 'video/mp4',
          title: optimizedFile.name,
        },
        onError: reject,
        onProgress: (uploaded, total) => onUploadProgress?.(total ? Math.round((uploaded / total) * 100) : 0),
        onSuccess: resolve,
      });
      upload.start();
    });

    await waitForPlayable(authorization.videoId, authorization.uploadToken, onProcessingProgress);
    return {
      url: authorization.playbackUrl,
      provider: 'bunny',
      providerVideoId: authorization.videoId,
      thumbnailUrl: authorization.thumbnailUrl,
      uploadToken: authorization.uploadToken,
    };
  } catch (error) {
    await deleteBunnyVideo(authorization.videoId, authorization.uploadToken).catch(() => {});
    throw error;
  }
};

export const deleteBunnyVideo = async (videoId, uploadToken) => {
  if (!videoId) return;
  const params = new URLSearchParams({ videoId });
  if (uploadToken) params.set('uploadToken', uploadToken);
  const response = await authenticatedFetch(`/api/bunny-video?${params}`, {
    method: 'DELETE',
  });
  if (!response.ok && response.status !== 404) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Could not delete the video from Bunny.');
  }
};
