import type { VisionDetection } from '../types';
import type { YoloPreprocessResult } from './preprocess';

export const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
  'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
  'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
  'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle',
  'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
  'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed',
  'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven',
  'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

interface CandidateBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  score: number;
  classId: number;
}

/**
 * Post-processes YOLO11 output tensor:
 * Shape is [1, 84, 8400] (or [84, 8400]):
 * - Row 0: cx
 * - Row 1: cy
 * - Row 2: w
 * - Row 3: h
 * - Rows 4..83: class probabilities (80 COCO classes)
 */
export function postprocessYOLO(
  outputData: Float32Array,
  meta: YoloPreprocessResult,
  confThreshold = 0.25,
  iouThreshold = 0.45
): VisionDetection[] {
  const NUM_CLASSES = 80;
  const numAnchors = 8400; // 6400 + 1600 + 400

  const candidateBoxes: CandidateBox[] = [];

  // outputData layout is [84, 8400] in row-major order:
  // channel c for anchor a is at outputData[c * numAnchors + a]
  for (let a = 0; a < numAnchors; a++) {
    // Find best class score among 80 classes
    let maxScore = -Infinity;
    let maxClassId = -1;

    for (let c = 0; c < NUM_CLASSES; c++) {
      const score = outputData[(4 + c) * numAnchors + a];
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c;
      }
    }

    if (maxScore < confThreshold) {
      continue;
    }

    // Box coordinates in 640x640 canvas
    const cx = outputData[0 * numAnchors + a];
    const cy = outputData[1 * numAnchors + a];
    const w = outputData[2 * numAnchors + a];
    const h = outputData[3 * numAnchors + a];

    const x1 = cx - w / 2;
    const y1 = cy - h / 2;
    const x2 = cx + w / 2;
    const y2 = cy + h / 2;

    candidateBoxes.push({
      x1,
      y1,
      x2,
      y2,
      score: maxScore,
      classId: maxClassId
    });
  }

  // Sort candidate boxes descending by score
  candidateBoxes.sort((a, b) => b.score - a.score);

  // Apply Non-Maximum Suppression (class-specific)
  const keptBoxes = applyClassNMS(candidateBoxes, iouThreshold);

  // Map back to original image coordinates
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
      category: COCO_CLASSES[box.classId] || `class_${box.classId}`,
      classId: box.classId,
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

function applyClassNMS(
  boxes: CandidateBox[],
  iouThresh: number
): CandidateBox[] {
  const kept: CandidateBox[] = [];

  for (const box of boxes) {
    let shouldKeep = true;
    for (const k of kept) {
      // Only compare boxes of the same class
      if (k.classId === box.classId) {
        const iou = computeIoU(box, k);
        if (iou >= iouThresh) {
          shouldKeep = false;
          break;
        }
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

  const interW = Math.max(0, xB - xA);
  const interH = Math.max(0, yB - yA);
  const interArea = interW * interH;

  if (interArea === 0) return 0;

  const areaA = Math.max(0, boxA.x2 - boxA.x1) * Math.max(0, boxA.y2 - boxA.y1);
  const areaB = Math.max(0, boxB.x2 - boxB.x1) * Math.max(0, boxB.y2 - boxB.y1);

  return interArea / (areaA + areaB - interArea);
}
