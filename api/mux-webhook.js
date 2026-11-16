import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import process from 'node:process';
import { getMuxAdmin, isMuxId, isUploadId, recordMuxResult } from '../server/mux.js';

function hasValidSignature(body, header, secret) {
  const entries = (header || '').split(',').map(entry => entry.trim().split('='));
  const timestamp = entries.find(([name]) => name === 't')?.[1];
  if (!/^\d+$/.test(timestamp || '') || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest();
  return entries.some(([name, signature]) => name === 'v1' && /^[a-f0-9]{64}$/i.test(signature || '') &&
    timingSafeEqual(expected, Buffer.from(signature, 'hex')));
}

export async function POST(request) {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) return new Response(null, { status: 503 });
  const body = Buffer.from(await request.arrayBuffer());
  if (!hasValidSignature(body, request.headers.get('mux-signature'), secret)) {
    return new Response(null, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body.toString('utf8'));
  } catch {
    return new Response(null, { status: 400 });
  }

  const asset = event?.data;
  const type = event?.type;
  const passthrough = typeof asset?.passthrough === 'string' ? asset.passthrough : '';
  const dishSubmission = passthrough.startsWith('dish:');
  const submissionId = dishSubmission ? passthrough.slice(5) : passthrough;
  if (!isUploadId(submissionId) || !isMuxId(asset?.id) ||
      !['video.asset.ready', 'video.asset.errored'].includes(type)) {
    return new Response(null, { status: 204 });
  }

  try {
    const status = type === 'video.asset.ready' ? 'ready' : 'errored';
    const admin = getMuxAdmin();
    if (dishSubmission) {
      const playbackId = asset.playback_ids?.find(playback => playback.policy === 'signed')?.id;
      const ready = status === 'ready' && isMuxId(playbackId);
      const { error } = await admin.from('dish_video_submissions').update({
        mux_asset_id: asset.id,
        mux_playback_id: ready ? playbackId : null,
        video_status: ready ? 'ready' : 'errored',
      }).eq('id', submissionId).eq('video_status', 'awaiting_upload');
      if (error) throw error;
    } else {
      await recordMuxResult(admin, submissionId, asset, status);
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Mux webhook update failed:', error);
    return new Response(null, { status: 500 });
  }
}
