import type { BoundingBox, Polygon } from './types';

/**
 * Loads an image from a URL, File, or Blob into an HTMLImageElement.
 */
export async function loadImage(source: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${err}`));
    };
  });
}

/**
 * Draws an image/canvas onto a new HTMLCanvasElement with target dimensions.
 */
export function imageToCanvas(
  source: CanvasImageSource,
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = targetWidth ?? (source instanceof HTMLImageElement ? source.naturalWidth : (source as any).width || 300);
  const h = targetHeight ?? (source instanceof HTMLImageElement ? source.naturalHeight : (source as any).height || 150);
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get 2D canvas context');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Calculates resize dimensions for detection model:
 * - Maintains aspect ratio.
 * - Caps max dimension at maxSideLimit (e.g. 960).
 * - Ensures both width and height are multiples of 32 (PP-OCR DBNet requirement).
 */
export function calculateDetectionDimensions(
  origWidth: number,
  origHeight: number,
  maxSideLimit = 960
): { targetWidth: number; targetHeight: number; scaleW: number; scaleH: number } {
  let ratio = 1.0;
  const maxSide = Math.max(origWidth, origHeight);
  if (maxSide > maxSideLimit) {
    ratio = maxSideLimit / maxSide;
  }

  // Dimension must be multiple of 32
  let targetWidth = Math.max(32, Math.round((origWidth * ratio) / 32) * 32);
  let targetHeight = Math.max(32, Math.round((origHeight * ratio) / 32) * 32);

  const scaleW = targetWidth / origWidth;
  const scaleH = targetHeight / origHeight;

  return { targetWidth, targetHeight, scaleW, scaleH };
}

/**
 * Resizes an image for the detection model.
 */
export function resizeForDetection(
  image: CanvasImageSource,
  origWidth: number,
  origHeight: number,
  maxSideLimit = 960
): { canvas: HTMLCanvasElement; scaleW: number; scaleH: number } {
  const { targetWidth, targetHeight, scaleW, scaleH } = calculateDetectionDimensions(
    origWidth,
    origHeight,
    maxSideLimit
  );

  const canvas = imageToCanvas(image, targetWidth, targetHeight);
  return { canvas, scaleW, scaleH };
}

/**
 * Converts a detection canvas into an ONNX Float32Array tensor:
 * - Channel layout: CHW [1, 3, H, W]
 * - Channel format: BGR
 * - Normalization:
 *   mean = [0.485, 0.456, 0.406]
 *   std  = [0.229, 0.224, 0.225]
 *   scale = 1 / 255.0
 */
export function detectionImageToTensor(
  canvas: HTMLCanvasElement
): { tensor: Float32Array; shape: [number, number, number, number] } {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  const imgData = ctx.getImageData(0, 0, width, height).data;
  const numPixels = width * height;
  const tensor = new Float32Array(3 * numPixels);

  const mean = [0.485, 0.456, 0.406]; // B, G, R
  const std = [0.229, 0.224, 0.225];

  const channelSize = numPixels;
  for (let i = 0; i < numPixels; i++) {
    const r = imgData[i * 4];
    const g = imgData[i * 4 + 1];
    const b = imgData[i * 4 + 2];

    // BGR channel ordering
    // B channel (channel 0)
    tensor[i] = (b / 255.0 - mean[0]) / std[0];
    // G channel (channel 1)
    tensor[channelSize + i] = (g / 255.0 - mean[1]) / std[1];
    // R channel (channel 2)
    tensor[channelSize * 2 + i] = (r / 255.0 - mean[2]) / std[2];
  }

  return { tensor, shape: [1, 3, height, width] };
}

/**
 * Crops a detected text region from the original image.
 * Uses perspective/affine crop when rotated, or simple bounding box if axis-aligned.
 */
interface Point2D {
  x: number;
  y: number;
}

/**
 * Robustly orders 4 arbitrary quadrilateral corner points into standard reading order:
 * 0: Top-Left (TL)     - minimum (x + y)
 * 1: Top-Right (TR)    - minimum (y - x)
 * 2: Bottom-Right (BR) - maximum (x + y)
 * 3: Bottom-Left (BL)  - maximum (y - x)
 */
export function orderPolygonPoints(
  polygon: Polygon
): [Point2D, Point2D, Point2D, Point2D] | null {
  if (!polygon || polygon.length < 4) return null;

  const pts: Point2D[] = polygon.slice(0, 4).map(([x, y]) => ({ x, y }));

  // Check for NaN or non-finite coordinates
  for (const p of pts) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      return null;
    }
  }

  // Find TL (min sum) and BR (max sum)
  let minSum = Infinity;
  let maxSum = -Infinity;
  let tlIdx = 0;
  let brIdx = 0;

  // Find TR (min diff y - x) and BL (max diff y - x)
  let minDiff = Infinity;
  let maxDiff = -Infinity;
  let trIdx = 0;
  let blIdx = 0;

  for (let i = 0; i < 4; i++) {
    const sum = pts[i].x + pts[i].y;
    const diff = pts[i].y - pts[i].x;

    if (sum < minSum) {
      minSum = sum;
      tlIdx = i;
    }
    if (sum > maxSum) {
      maxSum = sum;
      brIdx = i;
    }

    if (diff < minDiff) {
      minDiff = diff;
      trIdx = i;
    }
    if (diff > maxDiff) {
      maxDiff = diff;
      blIdx = i;
    }
  }

  // Degeneracy check: All 4 corner indices must be distinct
  const uniqueIndices = new Set([tlIdx, trIdx, brIdx, blIdx]);
  if (uniqueIndices.size !== 4) {
    // Fallback ordering: Sort points primarily by Y, then by X
    const sortedByY = [...pts].sort((a, b) => a.y - b.y);
    const topTwo = sortedByY.slice(0, 2).sort((a, b) => a.x - b.x);
    const bottomTwo = sortedByY.slice(2, 4).sort((a, b) => a.x - b.x);
    return [topTwo[0], topTwo[1], bottomTwo[1], bottomTwo[0]];
  }

  return [pts[tlIdx], pts[trIdx], pts[brIdx], pts[blIdx]];
}

/**
 * Calculates the 2D affine transformation matrix [a, b, c, d, e, f]
 * that maps source triangle (s0, s1, s2) to destination triangle (d0, d1, d2).
 *
 * In HTML5 Canvas context:
 *   destX = a * srcX + c * srcY + e
 *   destY = b * srcX + d * srcY + f
 *
 * When ctx.setTransform(a, b, c, d, e, f) is set and ctx.drawImage(src, 0, 0)
 * is called, every point (srcX, srcY) on the source image lands at (destX, destY)
 * on the destination canvas.
 */
export function getAffineTransform(
  s0: Point2D,
  s1: Point2D,
  s2: Point2D,
  d0: Point2D,
  d1: Point2D,
  d2: Point2D
): [number, number, number, number, number, number] | null {
  // Determinant of the source triangle matrix S:
  // [ s0.x  s1.x  s2.x ]
  // [ s0.y  s1.y  s2.y ]
  // [  1     1     1   ]
  const det = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(det) < 1e-6) {
    return null; // Collinear points — degenerate triangle
  }

  // Inverse matrix of S: S_inv = adj(S) / det
  const inv00 = (s1.y - s2.y) / det;
  const inv01 = (s2.x - s1.x) / det;
  const inv02 = (s1.x * s2.y - s2.x * s1.y) / det;

  const inv10 = (s2.y - s0.y) / det;
  const inv11 = (s0.x - s2.x) / det;
  const inv12 = (s2.x * s0.y - s0.x * s2.y) / det;

  const inv20 = (s0.y - s1.y) / det;
  const inv21 = (s1.x - s0.x) / det;
  const inv22 = (s0.x * s1.y - s1.x * s0.y) / det;

  // Compute M = D * S_inv
  const a = d0.x * inv00 + d1.x * inv10 + d2.x * inv20;
  const c = d0.x * inv01 + d1.x * inv11 + d2.x * inv21;
  const e = d0.x * inv02 + d1.x * inv12 + d2.x * inv22;

  const b = d0.y * inv00 + d1.y * inv10 + d2.y * inv20;
  const d = d0.y * inv01 + d1.y * inv11 + d2.y * inv21;
  const f = d0.y * inv02 + d1.y * inv12 + d2.y * inv22;

  return [a, b, c, d, e, f];
}

/**
 * Fallback crop: extracts axis-aligned bounding box from source image.
 */
function fallbackBBoxCrop(
  sourceImage: CanvasImageSource,
  bbox: BoundingBox
): HTMLCanvasElement {
  const cropCanvas = document.createElement('canvas');
  const cropW = Math.max(1, Math.round(bbox.width || 1));
  const cropH = Math.max(1, Math.round(bbox.height || 1));

  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const ctx = cropCanvas.getContext('2d', { willReadFrequently: true });
  if (ctx) {
    ctx.drawImage(
      sourceImage,
      Math.max(0, bbox.x),
      Math.max(0, bbox.y),
      Math.max(1, bbox.width),
      Math.max(1, bbox.height),
      0,
      0,
      cropW,
      cropH
    );
  }
  return cropCanvas;
}

/**
 * Crops and geometrically rectifies a detected text region from the original image.
 *
 * Geometric Method:
 * 1. Validates the 4-point polygon and handles degenerate/malformed geometries safely.
 * 2. Orders corners into [Top-Left, Top-Right, Bottom-Right, Bottom-Left].
 * 3. Computes rectified width W and height H along the text baseline and height axes.
 * 4. If the region is already axis-aligned (within 0.75px tolerance), uses fast-path drawImage.
 * 5. If angled/rotated, rectifies the quadrilateral into a flat W x H canvas using
 *    piecewise 2-triangle affine mapping with sub-pixel seam protection:
 *      Triangle 1: (TL, TR, BL) -> ((0,0), (W,0), (0,H))
 *      Triangle 2: (TR, BR, BL) -> ((W,0), (W,H), (0,H))
 * 6. The output is a horizontal, deskewed canvas ready for recognition preprocessing.
 */
export function cropTextRegion(
  sourceImage: CanvasImageSource,
  polygon: Polygon,
  bbox: BoundingBox
): HTMLCanvasElement {
  // Safe validation & fallback on invalid inputs
  if (!polygon || !Array.isArray(polygon) || polygon.length < 4) {
    return fallbackBBoxCrop(sourceImage, bbox);
  }

  // 1. Order polygon points: [TL, TR, BR, BL]
  const ordered = orderPolygonPoints(polygon);
  if (!ordered) {
    return fallbackBBoxCrop(sourceImage, bbox);
  }

  const [tl, tr, br, bl] = ordered;

  // 2. Compute edge lengths
  const topW = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const bottomW = Math.hypot(br.x - bl.x, br.y - bl.y);
  const leftH = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const rightH = Math.hypot(br.x - tr.x, br.y - tr.y);

  const targetW = Math.max(1, Math.round(Math.max(topW, bottomW)));
  const targetH = Math.max(1, Math.round(Math.max(leftH, rightH)));

  // Fallback if dimensions are too small or degenerate
  if (targetW < 3 || targetH < 3) {
    return fallbackBBoxCrop(sourceImage, bbox);
  }

  // Check duplicate points (corners too close to each other)
  if (topW < 1.0 || bottomW < 1.0 || leftH < 1.0 || rightH < 1.0) {
    return fallbackBBoxCrop(sourceImage, bbox);
  }

  // 3. Fast-path: Check if quadrilateral is already axis-aligned
  const isAxisAligned =
    Math.abs(tl.y - tr.y) < 0.75 &&
    Math.abs(bl.y - br.y) < 0.75 &&
    Math.abs(tl.x - bl.x) < 0.75 &&
    Math.abs(tr.x - br.x) < 0.75;

  if (isAxisAligned) {
    return fallbackBBoxCrop(sourceImage, bbox);
  }

  // 4. Create rectified canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return fallbackBBoxCrop(sourceImage, bbox);
  }

  // Enable high-quality image smoothing for anti-aliasing during rotation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 5. Piecewise 2-triangle affine warp mapping:
  // Destination points:
  //   D_TL: (0, 0)
  //   D_TR: (targetW, 0)
  //   D_BR: (targetW, targetH)
  //   D_BL: (0, targetH)
  const dTL: Point2D = { x: 0, y: 0 };
  const dTR: Point2D = { x: targetW, y: 0 };
  const dBR: Point2D = { x: targetW, y: targetH };
  const dBL: Point2D = { x: 0, y: targetH };

  // Calculate transform for Triangle 1: (TL, TR, BL) -> (dTL, dTR, dBL)
  const m1 = getAffineTransform(tl, tr, bl, dTL, dTR, dBL);

  // Calculate transform for Triangle 2: (TR, BR, BL) -> (dTR, dBR, dBL)
  const m2 = getAffineTransform(tr, br, bl, dTR, dBR, dBL);

  if (!m1 || !m2) {
    // If analytical transform is singular, fall back safely
    return fallbackBBoxCrop(sourceImage, bbox);
  }

  // Draw Triangle 1 (Top-Left half)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dTL.x, dTL.y);
  // Add 0.5px subpixel dilation along the diagonal to eliminate seam artifacts
  ctx.lineTo(dTR.x + 0.5, dTR.y);
  ctx.lineTo(dBL.x, dBL.y + 0.5);
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(m1[0], m1[1], m1[2], m1[3], m1[4], m1[5]);
  ctx.drawImage(sourceImage, 0, 0);
  ctx.restore();

  // Draw Triangle 2 (Bottom-Right half)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(dTR.x, dTR.y);
  ctx.lineTo(dBR.x, dBR.y);
  ctx.lineTo(dBL.x, dBL.y);
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(m2[0], m2[1], m2[2], m2[3], m2[4], m2[5]);
  ctx.drawImage(sourceImage, 0, 0);
  ctx.restore();

  return canvas;
}

/**
 * Resizes a cropped text region for the recognition model (height=48, proportional width <= 320).
 */
export function resizeForRecognition(
  crop: HTMLCanvasElement | ImageData,
  targetHeight = 48,
  targetWidth = 320
): HTMLCanvasElement {
  const cropW = crop.width;
  const cropH = crop.height;

  const ratio = cropW / Math.max(1, cropH);
  let resizedW = Math.ceil(targetHeight * ratio);
  if (resizedW > targetWidth) {
    resizedW = targetWidth;
  }
  resizedW = Math.max(1, resizedW);

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = resizedW;
  resizedCanvas.height = targetHeight;
  const rCtx = resizedCanvas.getContext('2d', { willReadFrequently: true });
  if (!rCtx) throw new Error('Failed to get 2D canvas context for recognition');

  if (crop instanceof ImageData) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) tempCtx.putImageData(crop, 0, 0);
    rCtx.drawImage(tempCanvas, 0, 0, cropW, cropH, 0, 0, resizedW, targetHeight);
  } else {
    rCtx.drawImage(crop, 0, 0, cropW, cropH, 0, 0, resizedW, targetHeight);
  }

  return resizedCanvas;
}

/**
 * Prepares a cropped text image for the PP-OCR recognition model:
 * - Height fixed at 48.
 * - Width scaled proportionally, capped at targetWidth (e.g. 320).
 * - Zero-padded to targetWidth.
 * - BGR channel order.
 * - Normalized with: (val / 255.0 - 0.5) / 0.5.
 * - Tensor layout: CHW [1, 3, 48, 320].
 */
export function recognitionImageToTensor(
  crop: HTMLCanvasElement | ImageData,
  targetHeight = 48,
  targetWidth = 320
): { tensor: Float32Array; shape: [number, number, number, number] } {
  const resizedCanvas = resizeForRecognition(crop, targetHeight, targetWidth);
  const resizedW = resizedCanvas.width;
  const rCtx = resizedCanvas.getContext('2d', { willReadFrequently: true });
  if (!rCtx) throw new Error('Failed to get 2D canvas context for recognition');

  const imgData = rCtx.getImageData(0, 0, resizedW, targetHeight).data;

  // Final tensor has shape [1, 3, targetHeight, targetWidth]
  const totalPixels = targetHeight * targetWidth;
  const tensor = new Float32Array(3 * totalPixels); // zeros by default

  const c0Offset = 0;
  const c1Offset = totalPixels;
  const c2Offset = totalPixels * 2;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < resizedW; x++) {
      const srcIdx = (y * resizedW + x) * 4;
      const dstIdx = y * targetWidth + x;

      const r = imgData[srcIdx];
      const g = imgData[srcIdx + 1];
      const b = imgData[srcIdx + 2];

      // BGR ordering & normalization: (x / 255.0 - 0.5) / 0.5
      tensor[c0Offset + dstIdx] = (b / 255.0 - 0.5) / 0.5;
      tensor[c1Offset + dstIdx] = (g / 255.0 - 0.5) / 0.5;
      tensor[c2Offset + dstIdx] = (r / 255.0 - 0.5) / 0.5;
    }
  }

  return { tensor, shape: [1, 3, targetHeight, targetWidth] };
}

/**
 * Prepares a batch of cropped text images into a single contiguous ONNX tensor:
 * - Tensor shape: [B, 3, targetHeight, targetWidth]
 * - Zero-padded to targetWidth
 * - BGR channel order
 * - Normalization: (val / 255.0 - 0.5) / 0.5
 */
export function recognitionBatchToTensors(
  crops: (HTMLCanvasElement | ImageData)[],
  targetHeight = 48,
  targetWidth = 320
): { tensor: Float32Array; shape: [number, number, number, number] } {
  const batchSize = crops.length;
  const pixelsPerImage = targetHeight * targetWidth;
  const totalElements = batchSize * 3 * pixelsPerImage;
  const batchTensor = new Float32Array(totalElements); // Zero-initialized

  for (let b = 0; b < batchSize; b++) {
    const crop = crops[b];
    const resizedCanvas = resizeForRecognition(crop, targetHeight, targetWidth);
    const resizedW = resizedCanvas.width;
    const rCtx = resizedCanvas.getContext('2d', { willReadFrequently: true });
    if (!rCtx) continue;

    const imgData = rCtx.getImageData(0, 0, resizedW, targetHeight).data;
    const bOffset = b * 3 * pixelsPerImage;
    const c0Offset = bOffset;
    const c1Offset = bOffset + pixelsPerImage;
    const c2Offset = bOffset + pixelsPerImage * 2;

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < resizedW; x++) {
        const srcIdx = (y * resizedW + x) * 4;
        const dstIdx = y * targetWidth + x;

        const r = imgData[srcIdx];
        const g = imgData[srcIdx + 1];
        const bVal = imgData[srcIdx + 2];

        // BGR ordering & normalization
        batchTensor[c0Offset + dstIdx] = (bVal / 255.0 - 0.5) / 0.5;
        batchTensor[c1Offset + dstIdx] = (g / 255.0 - 0.5) / 0.5;
        batchTensor[c2Offset + dstIdx] = (r / 255.0 - 0.5) / 0.5;
      }
    }
  }

  return { tensor: batchTensor, shape: [batchSize, 3, targetHeight, targetWidth] };
}

/**
 * Section 13 API alias for detection tensor conversion.
 */
export const imageToTensor = detectionImageToTensor;
