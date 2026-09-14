import * as ort from 'onnxruntime-web';

export interface YoloPreprocessResult {
  tensor: ort.Tensor;
  targetSize: number;
  scale: number;
  padX: number;
  padY: number;
  origWidth: number;
  origHeight: number;
}

/**
 * Standard YOLO11 letterbox preprocessing:
 * 1. Resizes image preserving aspect ratio to fit inside 640x640.
 * 2. Centers the scaled image with gray padding (114, 114, 114) or black.
 * 3. Normalizes RGB values to [0.0, 1.0].
 * 4. Converts to NCHW Float32 tensor [1, 3, 640, 640].
 */
export function preprocessYOLO(
  image: HTMLImageElement | HTMLCanvasElement,
  targetSize = 640
): YoloPreprocessResult {
  const origWidth = image.width;
  const origHeight = image.height;

  // Aspect-ratio preserving scale
  const scale = Math.min(targetSize / origWidth, targetSize / origHeight);
  const scaledW = Math.round(origWidth * scale);
  const scaledH = Math.round(origHeight * scale);

  const padX = Math.round((targetSize - scaledW) / 2);
  const padY = Math.round((targetSize - scaledH) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D canvas context for YOLO preprocessing.');
  }

  // Standard YOLO padding color: rgb(114, 114, 114)
  ctx.fillStyle = '#727272';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Draw image centered
  ctx.drawImage(image, 0, 0, origWidth, origHeight, padX, padY, scaledW, scaledH);

  const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
  const rgba = imgData.data;

  // Planar NCHW Float32 tensor [1, 3, 640, 640]
  const planeSize = targetSize * targetSize;
  const tensorData = new Float32Array(3 * planeSize);

  const rOffset = 0 * planeSize;
  const gOffset = 1 * planeSize;
  const bOffset = 2 * planeSize;

  for (let i = 0; i < planeSize; i++) {
    const srcIdx = i * 4;
    tensorData[rOffset + i] = rgba[srcIdx] / 255.0;
    tensorData[gOffset + i] = rgba[srcIdx + 1] / 255.0;
    tensorData[bOffset + i] = rgba[srcIdx + 2] / 255.0;
  }

  const tensor = new ort.Tensor('float32', tensorData, [1, 3, targetSize, targetSize]);

  return {
    tensor,
    targetSize,
    scale,
    padX,
    padY,
    origWidth,
    origHeight
  };
}
