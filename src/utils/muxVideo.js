import { supabase } from '../supabaseClient';

const uploadedFiles = new WeakMap();

async function muxVideoRequest(method, params = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in again before managing videos.');

  const response = await fetch(`/api/mux-video?${new URLSearchParams(params)}`, {
    method,
    headers: { Authorization: `Bearer ${session.access_token}` },
    signal: AbortSignal.timeout(15000),
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.error || `Video request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function sendVideo(file, uploadUrl, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', uploadUrl);
    request.timeout = 30 * 60 * 1000;
    request.setRequestHeader('Content-Type', file.type);
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress?.(Math.round(100 * event.loaded / event.total));
    };
    const fail = () => reject(new Error('Could not upload the video to Mux. Please try again.'));
    request.onerror = fail;
    request.ontimeout = fail;
    request.onabort = fail;
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else fail();
    };
    request.send(file);
  });
}

export async function uploadVideoToMux(file, { onUploadProgress, onProcessingProgress } = {}) {
  if (!file?.type?.startsWith('video/')) throw new Error('Please select a valid video file.');
  let uploadId = uploadedFiles.get(file);
  if (!uploadId) {
    const upload = await muxVideoRequest('POST');
    uploadId = upload.uploadId;
    try {
      await sendVideo(file, upload.uploadUrl, onUploadProgress);
    } catch (error) {
      await discardMuxUpload(uploadId).catch(() => {});
      throw error;
    }
    uploadedFiles.set(file, uploadId);
  }

  onProcessingProgress?.();
  const deadline = Date.now() + 5 * 60 * 1000;
  // Let the webhook do the work first. Check Mux directly at most once per 12 seconds per upload.
  let nextMuxCheck = Date.now() + 6000;
  while (Date.now() < deadline) {
    const checkMux = Date.now() >= nextMuxCheck;
    if (checkMux) nextMuxCheck = Date.now() + 12000;
    const video = await muxVideoRequest('GET', { uploadId, checkMux: checkMux ? '1' : '0' }).catch(error => {
      if (error.status === 404) uploadedFiles.delete(file);
      if ([401, 403, 404].includes(error.status)) throw error;
      return null;
    });
    if (video?.status === 'ready') {
      uploadedFiles.delete(file);
      return { ...video, uploadId, provider: 'mux' };
    }
    if (video?.status === 'errored') {
      uploadedFiles.delete(file);
      await discardMuxUpload(uploadId).catch(() => {});
      throw new Error('Mux could not process this video. Try a different file.');
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  throw new Error('The video was uploaded. Click Save again to check whether Mux has finished processing it.');
}

export const discardMuxUpload = uploadId => muxVideoRequest('DELETE', { uploadId });
export const deleteMuxVideo = assetId => muxVideoRequest('DELETE', { assetId });
