import { PrivacyRegion, BoundingBox } from '../../src/shared/types';

export interface PerformanceMetrics {
  domParsingLatencyMs: number;
  privacyIntelligenceLatencyMs: number;
  ocrLatencyMs: number;
  visionLatencyMs: number;
  redactionLatencyMs: number;
  endToEndLatencyMs: number;
  memoryUsageMb: number;
  cpuTimeMs: number;
}

export interface MetricResults {
  piiPrecision: number;
  piiRecall: number;
  piiF1: number;
  redactionIoU: number;
  visualDetectionAccuracy: number;
  ocrAccuracyChar: number;
  ocrAccuracyWord: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
}

/**
 * Calculates Intersection over Union (IoU) between two bounding boxes
 */
export function calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number {
  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
  const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

  const interWidth = Math.max(0, xB - xA);
  const interHeight = Math.max(0, yB - yA);
  const interArea = interWidth * interHeight;

  const areaA = boxA.width * boxA.height;
  const areaB = boxB.width * boxB.height;
  const unionArea = areaA + areaB - interArea;

  return unionArea === 0 ? 0 : interArea / unionArea;
}

/**
 * Calculates Character Error Rate (CER) and Character Accuracy
 */
export function calculateOCRAccuracy(reference: string, hypothesis: string): { cer: number; accuracy: number } {
  const ref = reference.trim();
  const hyp = hypothesis.trim();
  if (ref.length === 0) return { cer: 0, accuracy: 1.0 };

  // Levenshtein distance calculation
  const matrix: number[][] = [];
  for (let i = 0; i <= ref.length; i++) matrix[i] = [i];
  for (let j = 0; j <= hyp.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= ref.length; i++) {
    for (let j = 1; j <= hyp.length; j++) {
      const cost = ref[i - 1] === hyp[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[ref.length][hyp.length];
  const cer = distance / ref.length;
  const accuracy = Math.max(0, 1 - cer);
  return { cer, accuracy };
}

/**
 * Evaluates PII Detection metrics against Ground Truth
 */
export function evaluatePIIMetrics(
  detectedRegions: PrivacyRegion[],
  expectedPII: Array<{ category: string; target: string; source: string }>,
  expectedNonPIICount: number
): { tp: number; fp: number; fn: number; tn: number; precision: number; recall: number; f1: number } {
  let tp = 0;
  let fp = 0;
  let fn = 0;

  // Exclude visual / face regions from text PII evaluation
  const textRegions = detectedRegions.filter(r => r.source !== 'vision' && r.category !== 'FACE');
  const matchedExpected = new Set<number>();

  for (const region of textRegions) {
    let matched = false;
    expectedPII.forEach((gt, idx) => {
      if (matchedExpected.has(idx)) return;
      // Match by category or generic PII structure
      if (region.category === gt.category || (region.category === 'OTHER' && (gt.category === 'OTHER' || gt.category === 'SSN' || gt.category === 'CREDIT_CARD'))) {
        matched = true;
        matchedExpected.add(idx);
        tp++;
      }
    });

    if (!matched) {
      fp++;
    }
  }

  fn = expectedPII.length - matchedExpected.size;
  const tn = expectedNonPIICount;

  const precision = (tp + fp) > 0 ? tp / (tp + fp) : (expectedPII.length === 0 ? 1.0 : 0.0);
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : (expectedPII.length === 0 ? 1.0 : 0.0);
  const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 1.0;

  return { tp, fp, fn, tn, precision, recall, f1 };
}

