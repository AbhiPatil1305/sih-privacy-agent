/**
 * Common vision data types and contracts for YOLO11n and RetinaFace smoke tests.
 * Follows smoketest.md specification.
 */

export interface VisionDetection {
  category: string;
  classId: number;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VisionMetadata {
  model: string;
  executionProvider: 'webgpu' | 'wasm';
  modelLoadMs?: number;
  preprocessingMs?: number;
  inferenceMs: number;
  postprocessingMs?: number;
  totalMs?: number;
}

export interface VisionResponse {
  detections: VisionDetection[];
  metadata: VisionMetadata;
}

export interface VisionModelDiagnostics {
  modelName: string;
  inputName: string;
  inputShape: (number | string)[];
  outputNames: string[];
  outputShapes: (number | string)[][];
  provider: 'webgpu' | 'wasm';
  loadTimeMs: number;
}

export interface DetectionOptions {
  preferredProvider?: 'webgpu' | 'wasm';
  confidenceThreshold?: number;
  iouThreshold?: number;
}
