import { forwardRef, useCallback, useEffect, useRef } from 'react';
import Hls from 'hls.js';

const normalizeVideoUrl = (src) => {
  if (typeof src !== 'string') return '';
  const url = src.trim();
  if (/^[a-zA-Z0-9_-]{15,}$/.test(url)) {
    return `https://stream.mux.com/${url}.m3u8`;
  }

  return url.replace(
    /^(https:\/\/stream\.mux\.com\/[a-zA-Z0-9_-]+)\/?(?=[?#]|$)/i,
    '$1.m3u8',
  );
};

const AdaptiveVideo = forwardRef(function AdaptiveVideo({ src, autoPlay, ...props }, forwardedRef) {
  const internalRef = useRef(null);
  const setVideoElement = useCallback((element) => {
    internalRef.current = element;
    if (typeof forwardedRef === 'function') return forwardedRef(element);
    if (forwardedRef) forwardedRef.current = element;
    return undefined;
  }, [forwardedRef]);

  const videoUrl = normalizeVideoUrl(src);

  useEffect(() => {
    const video = internalRef.current;
    if (!video || !videoUrl) return undefined;

    let active = true;
    let hls;
    let recoveredMedia = false;
    const play = () => {
      if (!autoPlay || !video.paused) return;
      video.play().catch(error => {
        if (active && error.name === 'NotAllowedError' && !video.muted) {
          video.muted = true;
          video.play().catch(() => {});
        }
      });
    };
    video.addEventListener('canplay', play, { once: true });

    if (/\.m3u8(?=[?#]|$)/i.test(videoUrl) && Hls.isSupported()) {
      hls = new Hls({ enableWorker: false, lowLatencyMode: false });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!active || !data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recoveredMedia) {
          recoveredMedia = true;
          hls.recoverMediaError();
          return;
        }

        hls.destroy();
        hls = undefined;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = videoUrl;
        } else {
          video.dispatchEvent(new Event('error'));
        }
      });

      // Load once. MEDIA_ATTACHED can fire again when the player recovers.
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
    } else {
      video.src = videoUrl;
    }

    return () => {
      active = false;
      video.removeEventListener('canplay', play);
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [videoUrl, autoPlay]);

  return <video ref={setVideoElement} autoPlay={autoPlay} preload="auto" playsInline {...props} />;
});

export default AdaptiveVideo;
