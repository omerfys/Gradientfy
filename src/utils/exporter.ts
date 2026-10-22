import { createExportRenderer, splitTiles, GradientParams } from '../engine';
import { GifWriter } from 'omggif';

export interface ExportImageOptions {
  params: GradientParams;
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
  quality?: number; // 0.1 to 1.0
  timeSeconds?: number;
}

export interface ExportVideoOptions {
  params: GradientParams;
  width: number;
  height: number;
  durationSeconds?: number;
  fps?: number;
  format?: 'webm' | 'mp4';
  onProgress?: (progress: number) => void;
}

export interface ExportGifOptions {
  params: GradientParams;
  width: number;
  height: number;
  durationSeconds?: number;
  fps?: number;
  onProgress?: (progress: number) => void;
}

/**
 * Render a high-resolution still image using WebGL2 tiled rendering
 */
export async function renderToCanvas(
  params: GradientParams,
  width: number,
  height: number,
  timeSeconds = 0
): Promise<HTMLCanvasElement> {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context for export');
  }

  // Create WebGL2 export renderer
  const maxTile = 2048;
  const renderer = createExportRenderer(params, maxTile);
  const actualTileSize = renderer.limits.maxTileSize;

  try {
    const tiles = splitTiles(width, height, actualTileSize);
    for (const tile of tiles) {
      renderer.renderFrame(
        {
          frameIndex: Math.round(timeSeconds * 60),
          timeSeconds,
          frameRate: 60,
        },
        tile
      );

      ctx.drawImage(
        renderer.canvas as HTMLCanvasElement,
        0,
        0,
        tile.width,
        tile.height,
        tile.x,
        tile.y,
        tile.width,
        tile.height
      );
    }
    return outputCanvas;
  } finally {
    renderer.destroy();
  }
}

/**
 * Export high-resolution image file (PNG, JPG, WebP)
 */
export async function exportImage(options: ExportImageOptions): Promise<Blob> {
  const { params, width, height, format, quality = 0.95, timeSeconds = 0 } = options;
  const canvas = await renderToCanvas(params, width, height, timeSeconds);

  const { promise, resolve, reject } = Promise.withResolvers<Blob>();
  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  canvas.toBlob(
    (blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error(`Failed to create ${format} blob`));
      }
    },
    mimeType,
    quality
  );
  return promise;
}

/**
 * Export pure vector or high-fidelity SVG
 */
export function exportSvg(params: GradientParams, width: number, height: number): string {
  const colors = params.colors;
  const bg = params.background;
  const count = colors.length;

  const stops = colors
    .map((col, idx) => {
      const offset = Math.round((idx / Math.max(1, count - 1)) * 100);
      return `    <stop offset="${offset}%" stop-color="${col}" />`;
    })
    .join('\n');

  const radialStops1 = colors
    .slice(0, 3)
    .map((col, idx) => {
      const offset = Math.round((idx / 2) * 100);
      return `    <stop offset="${offset}%" stop-color="${col}" stop-opacity="${idx === 0 ? 0.9 : 0.4}" />`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
${stops}
    </linearGradient>
    <radialGradient id="glow1" cx="30%" cy="30%" r="70%">
${radialStops1}
      <stop offset="100%" stop-color="${bg}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow2" cx="70%" cy="80%" r="60%">
      <stop offset="0%" stop-color="${colors[colors.length - 1] || '#ffffff'}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="${bg}" stop-opacity="0" />
    </radialGradient>
    <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${Math.round(params.blur * 80)}" />
    </filter>
  </defs>
  
  <!-- Background base -->
  <rect width="100%" height="100%" fill="${bg}" />
  
  <!-- Gradient layers -->
  <rect width="100%" height="100%" fill="url(#mainGrad)" opacity="0.85" />
  <rect width="100%" height="100%" fill="url(#glow1)" filter="url(#blurFilter)" />
  <rect width="100%" height="100%" fill="url(#glow2)" filter="url(#blurFilter)" />
</svg>`;
}

/**
 * Export animated looping GIF using omggif
 */
export async function exportGif(options: ExportGifOptions): Promise<Blob> {
  const {
    params,
    width = 480,
    height = 270,
    durationSeconds = 4,
    fps = 15,
    onProgress
  } = options;

  const gifWidth = Math.min(width, 640);
  const gifHeight = Math.round((gifWidth / width) * height);
  const totalFrames = Math.max(5, Math.round(durationSeconds * fps));
  const delayCentisecs = Math.round(100 / fps);

  const canvas = document.createElement('canvas');
  canvas.width = gifWidth;
  canvas.height = gifHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Cannot get 2D context');

  const renderer = createExportRenderer(params, 1024);
  const target = {
    fullWidth: gifWidth,
    fullHeight: gifHeight,
    x: 0,
    y: 0,
    width: gifWidth,
    height: gifHeight,
  };

  const buffer = new Uint8Array(gifWidth * gifHeight * totalFrames + 1024);
  const gifWriter = new GifWriter(buffer, gifWidth, gifHeight, { loop: 0 });

  try {
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const timeSeconds = (frameIndex / totalFrames) * durationSeconds;
      renderer.renderFrame({ frameIndex, timeSeconds, frameRate: fps }, target);

      ctx.drawImage(renderer.canvas as HTMLCanvasElement, 0, 0, gifWidth, gifHeight);
      const imgData = ctx.getImageData(0, 0, gifWidth, gifHeight);
      const pixels = imgData.data;

      const palette: number[] = [];
      const colorMap = new Map<number, number>();
      const indexedPixels = new Uint8Array(gifWidth * gifHeight);

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i] & 0xf8;
        const g = pixels[i + 1] & 0xf8;
        const b = pixels[i + 2] & 0xf8;
        const rgbKey = (r << 16) | (g << 8) | b;

        let palIdx = colorMap.get(rgbKey);
        if (palIdx === undefined) {
          if (palette.length < 256) {
            palIdx = palette.length;
            palette.push(rgbKey);
            colorMap.set(rgbKey, palIdx);
          } else {
            let minDist = Infinity;
            let closest = 0;
            for (let c = 0; c < palette.length; c++) {
              const pr = (palette[c] >> 16) & 0xff;
              const pg = (palette[c] >> 8) & 0xff;
              const pb = palette[c] & 0xff;
              const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
              if (dist < minDist) {
                minDist = dist;
                closest = c;
              }
            }
            palIdx = closest;
          }
        }
        indexedPixels[i / 4] = palIdx;
      }

      while (palette.length < 256) {
        palette.push(0);
      }

      gifWriter.addFrame(0, 0, gifWidth, gifHeight, indexedPixels as unknown as number[], {
        palette,
        delay: delayCentisecs,
      });

      if (onProgress) {
        onProgress((frameIndex + 1) / totalFrames);
      }
    }

    const gifBytes = buffer.subarray(0, gifWriter.end());
    return new Blob([gifBytes], { type: 'image/gif' });
  } finally {
    renderer.destroy();
  }
}

/**
 * Export seamless looping WebM / MP4 video using canvas.captureStream and MediaRecorder
 */
export async function exportVideo(options: ExportVideoOptions): Promise<Blob> {
  const {
    params,
    width = 1280,
    height = 720,
    durationSeconds = 6,
    fps = 30,
    onProgress
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get 2D context for video export');

  const renderer = createExportRenderer(params, 2048);
  const target = {
    fullWidth: width,
    fullHeight: height,
    x: 0,
    y: 0,
    width,
    height,
  };

  const mimeType = MediaRecorder.isTypeSupported('video/mp4')
    ? 'video/mp4'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 10_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const { promise, resolve, reject } = Promise.withResolvers<Blob>();

  recorder.onstop = () => {
    renderer.destroy();
    resolve(new Blob(chunks, { type: mimeType }));
  };

  recorder.onerror = (e) => {
    renderer.destroy();
    reject(e);
  };

  recorder.start();

  const totalFrames = Math.round(durationSeconds * fps);
  let frame = 0;

  const intervalMs = 1000 / fps;
  const intervalId = setInterval(() => {
    if (frame >= totalFrames) {
      clearInterval(intervalId);
      recorder.stop();
      return;
    }

    const timeSeconds = (frame / totalFrames) * durationSeconds;
    renderer.renderFrame({ frameIndex: frame, timeSeconds, frameRate: fps }, target);
    ctx.drawImage(renderer.canvas as HTMLCanvasElement, 0, 0, width, height);

    frame++;
    if (onProgress) {
      onProgress(frame / totalFrames);
    }
  }, intervalMs);

  return promise;
}

/**
 * Generate CSS rules
 */
export function generateCss(params: GradientParams): string {
  const colors = params.colors.join(', ');
  const linear = `linear-gradient(135deg, ${colors})`;

  return `/* Static Gradient Fallback */
.gradient-bg {
  background-color: ${params.background};
  background-image: ${linear};
  background-size: cover;
  background-position: center;
}

/* Layered Mesh Simulation */
.gradient-mesh {
  background-color: ${params.background};
  background-image: 
    radial-gradient(at 0% 0%, ${params.colors[0] || '#fff'} 0px, transparent 50%),
    radial-gradient(at 100% 0%, ${params.colors[1] || '#999'} 0px, transparent 50%),
    radial-gradient(at 100% 100%, ${params.colors[2] || '#333'} 0px, transparent 50%),
    radial-gradient(at 0% 100%, ${params.colors[3] || '#000'} 0px, transparent 50%);
}

/* Animated Flow (CSS Keyframes) */
@keyframes gradientAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.gradient-animated {
  background: linear-gradient(-45deg, ${params.colors.join(', ')});
  background-size: 300% 300%;
  animation: gradientAnimation ${params.loopSeconds}s ease infinite;
}`;
}

/**
 * Generate Tailwind CSS classes and configuration
 */
export function generateTailwind(params: GradientParams): string {
  const colorStops = params.colors
    .map((c, i) => (i === 0 ? `from-[${c}]` : i === params.colors.length - 1 ? `to-[${c}]` : `via-[${c}]`))
    .join(' ');

  return `<!-- Tailwind Arbitrary Utility Classes -->
<div class="w-full h-full bg-[${params.background}] bg-gradient-to-br ${colorStops}">
  <!-- Your content -->
</div>

// In tailwind.config.js
module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        'custom-gradient': "linear-gradient(135deg, ${params.colors.join(', ')})",
      },
      colors: {
        'gradient-bg': '${params.background}',
      }
    }
  }
}`;
}

/**
 * Generate React Component code
 */
export function generateReactComponent(params: GradientParams, name = 'GradientBackground'): string {
  const componentName = name.replace(/[^a-zA-Z0-9]/g, '');
  return `import React, { useEffect, useRef } from 'react';
import { mountGradient } from './gradient-engine';

export function ${componentName || 'Gradient'}({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const gradient = mountGradient(canvasRef.current, ${JSON.stringify(params, null, 2)});
    return () => gradient.unmount();
  }, []);

  return (
    <div className={\`relative overflow-hidden \${className}\`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}`;
}

/**
 * Helper to trigger browser file download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}
