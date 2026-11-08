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
  if (!isUploadId(asset?.passthrough) || !isMuxId(asset?.id) ||
      !['video.asset.ready', 'video.asset.errored'].includes(type)) {
    return new Response(null, { status: 204 });
  }

  try {
    const status = type === 'video.asset.ready' ? 'ready' : 'errored';
    await recordMuxResult(getMuxAdmin(), asset.passthrough, asset, status);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Mux webhook update failed:', error);
    return new Response(null, { status: 500 });
  }
}
