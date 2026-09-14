import * as ort from 'onnxruntime-web';

export interface PreprocessResult {
  tensor: ort.Tensor;
  targetWidth: number;
  targetHeight: number;
  scale: number;
  padX: number;
  padY: number;
  origWidth: number;
  origHeight: number;
}

/**
 * Preprocesses an image for RetinaFace:
 * 1. Letterbox resize preserving aspect ratio to target size (default 640x640).
 * 2. Convert to BGR format and subtract channel means [104, 117, 123].
 * 3. Convert to NCHW Float32 tensor [1, 3, H, W].
 */
export function preprocessRetinaFace(
  image: HTMLImageElement | HTMLCanvasElement,
  targetSize = 640
): PreprocessResult {
  const origWidth = image.width;
  const origHeight = image.height;

  // Compute letterbox scale and padding
  const scale = Math.min(targetSize / origWidth, targetSize / origHeight);
  const scaledW = Math.round(origWidth * scale);
  const scaledH = Math.round(origHeight * scale);

  const padX = Math.round((targetSize - scaledW) / 2);
  const padY = Math.round((targetSize - scaledH) / 2);

  // Draw onto canvas with zero padding (or mean padding)
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available for RetinaFace preprocessing.');
  }

  // Clear to black / zero
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Draw image centered
  ctx.drawImage(image, 0, 0, origWidth, origHeight, padX, padY, scaledW, scaledH);

  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const rgba = imgData.data;

  // NCHW tensor with BGR order and mean subtraction [104, 117, 123]
  const planeSize = targetSize * targetSize;
  const tensorData = new Float32Array(3 * planeSize);

  const bOffset = 0 * planeSize; // Blue channel
  const gOffset = 1 * planeSize; // Green channel
  const rOffset = 2 * planeSize; // Red channel

  const meanB = 104.0;
  const meanG = 117.0;
  const meanR = 123.0;

  for (let i = 0; i < planeSize; i++) {
    const srcIdx = i * 4;
    const r = rgba[srcIdx];
    const g = rgba[srcIdx + 1];
    const b = rgba[srcIdx + 2];

    tensorData[bOffset + i] = b - meanB;
    tensorData[gOffset + i] = g - meanG;
    tensorData[rOffset + i] = r - meanR;
  }

  const tensor = new ort.Tensor('float32', tensorData, [1, 3, targetSize, targetSize]);

  return {
    tensor,
    targetWidth: targetSize,
    targetHeight: targetSize,
    scale,
    padX,
    padY,
    origWidth,
    origHeight
  };
}
