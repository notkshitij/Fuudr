import { createHmac, randomUUID } from 'node:crypto';
import process from 'node:process';
import { getMuxAdmin, isMuxId, isUploadId, muxRequest } from '../server/mux.js';
import { MAX_DISH_VIDEO_BYTES } from '../shared/dishVideoLimits.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });

    const origin = request.headers.get('origin');
    const allowedOrigins = (process.env.MUX_UPLOAD_ORIGINS || 'https://fuudr.com,https://www.fuudr.com')
      .split(',').map(value => value.trim());
    const localOrigin = process.env.NODE_ENV !== 'production' &&
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!allowedOrigins.includes(origin) && !localOrigin) {
      return Response.json({ error: 'This site is not allowed to upload videos.' }, { status: 403 });
    }

    let input;
    try {
      input = await request.json();
    } catch {
      return Response.json({ error: 'Invalid submission.' }, { status: 400 });
    }
    const { partnerId, dish, mobile, upi, size, consent } = input || {};
    if (!isUploadId(partnerId) || typeof dish !== 'string' || !dish.trim() || dish.trim().length > 120 ||
        typeof mobile !== 'string' || !/^[0-9]{10}$/.test(mobile) ||
        typeof upi !== 'string' || upi.trim().length > 120 || !/^[^\s@]+@[^\s@]+$/.test(upi.trim()) ||
        !Number.isInteger(size) || size < 1 || size > MAX_DISH_VIDEO_BYTES || consent !== true) {
      return Response.json({ error: 'Check your submission details. Each video must be 100 MB or smaller.' }, { status: 400 });
    }

    try {
      const secret = process.env.MUX_WEBHOOK_SECRET;
      if (!secret) return Response.json({ error: 'Video submissions are temporarily unavailable.' }, { status: 503 });
      const admin = getMuxAdmin();
      const id = randomUUID();
      const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() || 'unknown';
      const { error: insertError } = await admin.from('dish_video_submissions').insert({
        id,
        partner_id: partnerId,
        dish_name: dish.trim(),
        mobile: '+91' + mobile,
        upi_id: upi.trim(),
        file_size_bytes: size,
        upload_source_hash: createHmac('sha256', secret).update(ip).digest('hex'),
      });
      if (insertError?.code === 'P0429') {
        return Response.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
      }
      if (insertError?.code === '23503') {
        return Response.json({ error: 'Choose an available restaurant.' }, { status: 400 });
      }
      if (insertError) throw insertError;

      let upload;
      try {
        upload = await muxRequest('/uploads', {
          method: 'POST',
          body: {
            cors_origin: origin,
            timeout: 900,
            new_asset_settings: {
              playback_policies: ['public'],
              video_quality: 'basic',
              passthrough: 'dish:' + id,
            },
          },
        });
        if (!isMuxId(upload?.id) || !upload.url) throw new Error('Mux did not return an upload URL.');
        const { error } = await admin.from('dish_video_submissions')
          .update({ mux_upload_id: upload.id }).eq('id', id);
        if (error) throw error;
      } catch (error) {
        if (isMuxId(upload?.id)) {
          await muxRequest('/uploads/' + upload.id + '/cancel', { method: 'PUT' }).catch(() => {});
        }
        const { error: cleanupError } = await admin.from('dish_video_submissions').delete().eq('id', id);
        if (cleanupError) console.error('Dish upload cleanup failed:', cleanupError.code);
        throw error;
      }

      return Response.json({ uploadUrl: upload.url }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      if (/free plan is limited to 10 assets/i.test(error.message || '')) {
        console.error('Dish video upload unavailable: Mux asset limit reached.');
        return Response.json(
          { error: 'Video uploads are temporarily at capacity. Please try again later.' },
          { status: 409 },
        );
      }
      console.error('Dish video upload setup failed:', error.code || error.status || error.name);
      return Response.json({ error: 'Could not start the upload. Please try again.' }, { status: 500 });
    }
  },
};
