import type { OCRResult } from '../ocr/types';
import type { VisionDetection } from '../team2-vision/types';

export type { OCRResult, VisionDetection };

export interface PerceptionMetadata {
  executionProvider: 'webgpu' | 'wasm';
  preprocessingMs: number;
  detectionMs: number;
  recognitionMs: number;
  objectInferenceMs: number;
  faceInferenceMs: number;
  totalMs: number;
}

export interface PerceptionResponse {
  ocr: OCRResult[];
  objects: VisionDetection[];
  faces: VisionDetection[];
  metadata: PerceptionMetadata;
}

export interface PerceptionOptions {
  preferredProvider?: 'webgpu' | 'wasm';
  enableOCR?: boolean;
  enableObjects?: boolean;
  enableFaces?: boolean;
  executionMode?: 'sequential' | 'parallel';
  batchSize?: number;
}
