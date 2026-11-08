import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { getMuxAdmin, getPartner, isMuxId, isUploadId, muxRequest, recordMuxResult } from '../server/mux.js';

const noContent = () => new Response(null, { status: 204 });

async function createUpload(request, admin, partnerId) {
  const allowedOrigins = (process.env.MUX_UPLOAD_ORIGINS || 'https://fuudr.com,https://www.fuudr.com')
    .split(',').map(origin => origin.trim());
  const origin = request.headers.get('origin');
  if (!allowedOrigins.includes(origin)) {
    return Response.json({ error: 'This site is not allowed to upload videos.' }, { status: 403 });
  }

  const uploadId = randomUUID();
  const { error: insertError } = await admin.from('mux_reel_uploads').insert({
    id: uploadId,
    partner_id: partnerId,
  });
  if (insertError) throw insertError;

  let upload;
  try {
    upload = await muxRequest('/uploads', {
      method: 'POST',
      body: {
        cors_origin: origin,
        timeout: 3600,
        new_asset_settings: {
          playback_policies: ['public'],
          video_quality: 'basic',
          passthrough: uploadId,
        },
      },
    });
    if (!isMuxId(upload?.id) || !upload.url) throw new Error('Mux did not return an upload URL.');
    const { error } = await admin.from('mux_reel_uploads')
      .update({ mux_upload_id: upload.id }).eq('id', uploadId);
    if (error) throw error;
  } catch (error) {
    if (isMuxId(upload?.id)) {
      await muxRequest(`/uploads/${upload.id}/cancel`, { method: 'PUT' }).catch(() => {});
    }
    await admin.from('mux_reel_uploads').delete().eq('id', uploadId);
    throw error;
  }

  return Response.json({ uploadId, uploadUrl: upload.url }, { status: 201 });
}

async function refreshMuxStatus(admin, upload) {
  let assetId = upload.asset_id;
  if (!assetId) {
    if (!upload.mux_upload_id) return upload;
    const directUpload = await muxRequest(`/uploads/${upload.mux_upload_id}`);
    if (['errored', 'cancelled', 'timed_out'].includes(directUpload?.status)) {
      return await recordMuxResult(admin, upload.id, null, 'errored') ?? upload;
    }
    assetId = directUpload?.asset_id;
    if (!isMuxId(assetId)) return upload;
  }

  const asset = await muxRequest(`/assets/${assetId}`);
  if (!asset || asset.id !== assetId || asset.passthrough !== upload.id) {
    throw new Error('The Mux asset does not match the tracked upload.');
  }
  if (asset.status === 'ready' || asset.status === 'errored') {
    return await recordMuxResult(admin, upload.id, asset, asset.status) ?? upload;
  }
  if (!upload.asset_id) {
    const { error } = await admin.from('mux_reel_uploads')
      .update({ asset_id: assetId })
      .eq('id', upload.id)
      .eq('status', 'processing');
    if (error) throw error;
  }
  return upload;
}

async function removeUpload(admin, upload) {
  let assetId = upload.asset_id;
  if (!assetId && upload.mux_upload_id) {
    const path = `/uploads/${upload.mux_upload_id}`;
    const directUpload = await muxRequest(path).catch(error => {
      if (error.status !== 404) throw error;
      return null;
    });
    assetId = directUpload?.asset_id;
    if (directUpload?.status === 'waiting') {
      try {
        await muxRequest(`${path}/cancel`, { method: 'PUT' });
      } catch (error) {
        if (error.status !== 409 && error.status !== 400) throw error;
        // An upload can finish between the status and cancellation requests.
        const finished = await muxRequest(path);
        if (finished.status === 'waiting') throw error;
        assetId = finished.asset_id;
      }
    }
  }

  if (assetId) {
    const { data: references, error } = await admin.from('reels')
      .select('id').eq('video_provider', 'mux').eq('provider_video_id', assetId).limit(1);
    if (error) throw error;
    if (references.length) {
      return Response.json({ error: 'Remove the reel before deleting its Mux video.' }, { status: 409 });
    }
    await muxRequest(`/assets/${assetId}`, { method: 'DELETE' }).catch(error => {
      if (error.status !== 404) throw error;
    });
  }

  const { error } = await admin.from('mux_reel_uploads').delete().eq('id', upload.id);
  if (error) throw error;
  return noContent();
}

export default {
  async fetch(request) {
    const { method } = request;
    if (!['POST', 'GET', 'DELETE'].includes(method)) {
      return Response.json({ error: 'Method not allowed.' }, {
        status: 405, headers: { Allow: 'POST, GET, DELETE' },
      });
    }
    try {
      const { partnerId, status, error: authError } = await getPartner(request.headers.get('authorization'));
      if (authError) return Response.json({ error: authError }, { status });
      const admin = getMuxAdmin();
      if (method === 'POST') return await createUpload(request, admin, partnerId);

      const params = new URL(request.url).searchParams;
      const uploadId = params.get('uploadId');
      const assetId = params.get('assetId');
      if (!isUploadId(uploadId) && !(method === 'DELETE' && !uploadId && isMuxId(assetId))) {
        return Response.json({ error: 'A valid video identifier is required.' }, { status: 400 });
      }

      const { data: upload, error } = await admin.from('mux_reel_uploads')
        .select('id, mux_upload_id, asset_id, playback_id, status')
        .eq('partner_id', partnerId)
        .eq(uploadId ? 'id' : 'asset_id', uploadId || assetId)
        .maybeSingle();
      if (error) throw error;
      if (!upload) {
        if (method === 'DELETE') return noContent();
        return Response.json({ error: 'Video upload was not found.' }, { status: 404 });
      }
      if (method === 'DELETE') return await removeUpload(admin, upload);

      const current = upload.status === 'processing' && params.get('checkMux') !== '0'
        ? await refreshMuxStatus(admin, upload)
        : upload;
      return Response.json({
        status: current.status,
        ...(current.status === 'ready' && {
          providerVideoId: current.asset_id,
          url: `https://stream.mux.com/${current.playback_id}.m3u8`,
          thumbnailUrl: `https://image.mux.com/${current.playback_id}/thumbnail.jpg`,
        }),
      }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      console.error('Mux video request failed:', error);
      return Response.json({ error: 'Could not complete the Mux video request. Please try again.' }, { status: 500 });
    }
  },
};
