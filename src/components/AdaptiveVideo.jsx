import { forwardRef, useEffect, useRef } from 'react';
import Hls from 'hls.js';

const isHlsUrl = (src) => typeof src === 'string' && /\.m3u8(?:$|\?)/i.test(src);

const AdaptiveVideo = forwardRef(function AdaptiveVideo({ src, ...props }, forwardedRef) {
  const internalRef = useRef(null);

  const setVideoElement = (element) => {
    internalRef.current = element;
    if (typeof forwardedRef === 'function') forwardedRef(element);
    else if (forwardedRef) forwardedRef.current = element;
  };

  useEffect(() => {
    const video = internalRef.current;
    if (!video || !src) return undefined;

    if (!isHlsUrl(src) || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return () => video.removeAttribute('src');
    }

    if (!Hls.isSupported()) {
      video.src = src;
      return () => video.removeAttribute('src');
    }

    const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
    hls.loadSource(src);
    hls.attachMedia(video);
    return () => hls.destroy();
  }, [src]);

  return <video ref={setVideoElement} {...props} />;
});

export default AdaptiveVideo;
