// Client-side image prep for the Claude-vision extraction endpoint. Resizing
// happens in the browser (canvas) so we ship a small JPEG to the server rather
// than a full-res phone photo. The server holds the Anthropic key and does the
// actual vision call (POST /ai/extract-image).

import type { ImageExtractionInput } from '@sourcetool/shared';

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.85;

/**
 * Resize an image File to a bounded JPEG and return base64 (no `data:` prefix)
 * ready to POST to /ai/extract-image. Browser-only (uses Image + canvas).
 */
export async function prepareImageForExtraction(
  file: File
): Promise<ImageExtractionInput> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = dataUrl.split(',')[1] ?? '';
  return { base64, mediaType: 'image/jpeg' };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}
