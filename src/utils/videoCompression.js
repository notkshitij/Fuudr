import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import ffmpegCoreUrl from '@ffmpeg/core?url';
import ffmpegWasmUrl from '@ffmpeg/core/wasm?url';

let ffmpeg;
let ffmpegLoading;
let activeProgressCallback;
let activeLogLines = [];

const getFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;
  if (!ffmpegLoading) {
    ffmpegLoading = (async () => {
      const instance = new FFmpeg();
      instance.on('progress', ({ progress }) => activeProgressCallback?.(Math.round(progress * 100)));
      instance.on('log', ({ message }) => {
        activeLogLines.push(message);
        if (activeLogLines.length > 30) activeLogLines.shift();
      });
      // These bundled URLs make compression independent of a third-party CDN
      // and its CORS/worker policies. They are converted to blob URLs because
      // FFmpeg runs the core inside a Web Worker.
      await instance.load({
        coreURL: await toBlobURL(ffmpegCoreUrl, 'text/javascript'),
        wasmURL: await toBlobURL(ffmpegWasmUrl, 'application/wasm'),
      });
      ffmpeg = instance;
      return instance;
    })().catch((error) => {
      // Permit a retry if a temporary CDN/network failure prevented loading.
      ffmpegLoading = undefined;
      throw error;
    });
  }
  return ffmpegLoading;
};

/**
 * Produces a browser-compatible MP4/AAC file capped at 720px high and roughly
 * 2.5 Mbps before the file leaves the browser. Bunny receives only this
 * smaller source and produces H.264 HLS playback renditions.
 */
export const compressVideoForBunny = async (file, onProgress) => {
  if (!file?.type?.startsWith('video/')) {
    throw new Error('Please select a valid video file.');
  }

  onProgress?.(0);
  const processor = await getFFmpeg();
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const inputName = `input-${uniqueId}`;
  const outputName = `fuudr-reel-${uniqueId}.mp4`;

  try {
    activeProgressCallback = onProgress;
    activeLogLines = [];
    await processor.writeFile(inputName, await fetchFile(file));
    const exitCode = await processor.exec([
      '-i', inputName,
      '-map', '0:v:0',
      '-map', '0:a:0?',
      '-vf', 'scale=-2:720:force_original_aspect_ratio=decrease',
      // The browser runs the single-thread WebAssembly core. Its bundled x264
      // encoder is not dependable across browsers, so create a standard MPEG-4
      // MP4 source instead; Bunny Stream accepts it and makes the H.264 HLS
      // renditions used by the app.
      '-threads', '1',
      '-c:v', 'mpeg4',
      '-q:v', '5',
      '-maxrate', '2500k',
      '-bufsize', '5000k',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputName,
    ]);
    if (exitCode !== 0) {
      const diagnostics = activeLogLines
        .filter(line => /error|failed|invalid|unknown|not found|conversion/i.test(line))
        .slice(-3)
        .join(' ');
      throw new Error(diagnostics || 'Video conversion did not complete successfully.');
    }
    const data = await processor.readFile(outputName);
    if (!(data instanceof Uint8Array) || data.byteLength < 1024) {
      throw new Error('Video conversion produced an invalid file.');
    }
    return new File([data], file.name.replace(/\.[^.]+$/, '') + '-720p.mp4', {
      type: 'video/mp4',
      lastModified: Date.now(),
    });
  } catch (error) {
    throw new Error(`Could not optimize this video for upload: ${error.message || 'unknown error'}`, { cause: error });
  } finally {
    activeProgressCallback = undefined;
    await Promise.all([
      processor.deleteFile(inputName).catch(() => {}),
      processor.deleteFile(outputName).catch(() => {}),
    ]);
  }
};
