import type { VisionDetection } from '../types';
import type { PreprocessResult } from './preprocess';

// MobileNet0.25 RetinaFace anchor config
const RETINAFACE_CONFIG = {
  minSizes: [[16, 32], [64, 128], [256, 512]],
  steps: [8, 16, 32],
  variances: [0.1, 0.2]
};

interface AnchorBox {
  cx: number;
  cy: number;
  sx: number;
  sy: number;
}

// Cached prior boxes per target dimension
const priorBoxCache = new Map<string, AnchorBox[]>();

/**
 * Generates prior anchor boxes for RetinaFace at the given input resolution.
 */
export function generatePriorBoxes(width: number, height: number): AnchorBox[] {
  const cacheKey = `${width}x${height}`;
  const cached = priorBoxCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const anchors: AnchorBox[] = [];
  const { minSizes, steps } = RETINAFACE_CONFIG;

  for (let k = 0; k < steps.length; k++) {
    const step = steps[k];
    const minSizeGroup = minSizes[k];
    const featH = Math.ceil(height / step);
    const featW = Math.ceil(width / step);

    for (let i = 0; i < featH; i++) {
      for (let j = 0; j < featW; j++) {
        for (const minSize of minSizeGroup) {
          const sx = minSize / width;
          const sy = minSize / height;
          const cx = (j + 0.5) * step / width;
          const cy = (i + 0.5) * step / height;
          anchors.push({ cx, cy, sx, sy });
        }
      }
    }
  }

  priorBoxCache.set(cacheKey, anchors);
  return anchors;
}

/**
 * Decodes RetinaFace output tensors:
 * loc:  [1, 16800, 4] - box offsets per anchor
 * conf: [1, 16800, 2] - [background_score, face_score] per anchor
 */
export function postprocessRetinaFace(
  locData: Float32Array,
  confData: Float32Array,
  meta: PreprocessResult,
  confThreshold = 0.5,
  iouThreshold = 0.4
): VisionDetection[] {
  const priors = generatePriorBoxes(meta.targetWidth, meta.targetHeight);
  const numAnchors = priors.length;
  const [var0, var1] = RETINAFACE_CONFIG.variances;

  const candidateBoxes: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    score: number;
  }[] = [];

  for (let i = 0; i < numAnchors; i++) {
    // confData layout: [batch, anchors, 2] -> flattened as [anchor0_bg, anchor0_face, anchor1_bg, anchor1_face, ...]
    const faceScore = confData[i * 2 + 1];
    if (faceScore < confThreshold) {
      continue;
    }

    const prior = priors[i];
    // locData layout: [batch, anchors, 4] -> flattened as [anchor0_dx, anchor0_dy, anchor0_dw, anchor0_dh, anchor1_dx, ...]
    const dx = locData[i * 4];
    const dy = locData[i * 4 + 1];
    const dw = locData[i * 4 + 2];
    const dh = locData[i * 4 + 3];

    // Decode center and dimensions in normalized space [0, 1]
    const cx = prior.cx + dx * var0 * prior.sx;
    const cy = prior.cy + dy * var0 * prior.sy;
    const w = prior.sx * Math.exp(dw * var1);
    const h = prior.sy * Math.exp(dh * var1);

    // Convert to pixel coordinates on the model input canvas
    const boxX1 = (cx - w / 2) * meta.targetWidth;
    const boxY1 = (cy - h / 2) * meta.targetHeight;
    const boxX2 = (cx + w / 2) * meta.targetWidth;
    const boxY2 = (cy + h / 2) * meta.targetHeight;

    candidateBoxes.push({
      x1: boxX1,
      y1: boxY1,
      x2: boxX2,
      y2: boxY2,
      score: faceScore
    });
  }

  // Sort descending by score
  candidateBoxes.sort((a, b) => b.score - a.score);

  // Apply Non-Maximum Suppression (NMS)
  const keptBoxes = applyNMS(candidateBoxes, iouThreshold);

  // Map coordinates from model canvas back to original image coordinates
  const detections: VisionDetection[] = [];

  for (const box of keptBoxes) {
    // Undo letterbox padding and scale
    const origX1 = Math.max(0, Math.min(meta.origWidth, (box.x1 - meta.padX) / meta.scale));
    const origY1 = Math.max(0, Math.min(meta.origHeight, (box.y1 - meta.padY) / meta.scale));
    const origX2 = Math.max(0, Math.min(meta.origWidth, (box.x2 - meta.padX) / meta.scale));
    const origY2 = Math.max(0, Math.min(meta.origHeight, (box.y2 - meta.padY) / meta.scale));

    const width = Math.max(1, origX2 - origX1);
    const height = Math.max(1, origY2 - origY1);

    detections.push({
      category: 'FACE',
      classId: 0,
      confidence: Math.round(box.score * 1000) / 1000,
      bbox: {
        x: Math.round(origX1),
        y: Math.round(origY1),
        width: Math.round(width),
        height: Math.round(height)
      }
    });
  }

  return detections;
}

function applyNMS(
  boxes: { x1: number; y1: number; x2: number; y2: number; score: number }[],
  iouThresh: number
): { x1: number; y1: number; x2: number; y2: number; score: number }[] {
  const kept: { x1: number; y1: number; x2: number; y2: number; score: number }[] = [];

  for (const box of boxes) {
    let shouldKeep = true;
    for (const k of kept) {
      const iou = computeIoU(box, k);
      if (iou >= iouThresh) {
        shouldKeep = false;
        break;
      }
    }
    if (shouldKeep) {
      kept.push(box);
    }
  }

  return kept;
}

function computeIoU(
  boxA: { x1: number; y1: number; x2: number; y2: number },
  boxB: { x1: number; y1: number; x2: number; y2: number }
): number {
  const xA = Math.max(boxA.x1, boxB.x1);
  const yA = Math.max(boxA.y1, boxB.y1);
  const xB = Math.min(boxA.x2, boxB.x2);
  const yB = Math.min(boxA.y2, boxB.y2);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  if (interArea === 0) return 0;

  const areaA = Math.max(0, boxA.x2 - boxA.x1) * Math.max(0, boxA.y2 - boxA.y1);
  const areaB = Math.max(0, boxB.x2 - boxB.x1) * Math.max(0, boxB.y2 - boxB.y1);

  return interArea / (areaA + areaB - interArea);
}
