export interface Point {
  x: number;
  y: number;
}

export type Polygon = [number, number][];

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextRegion {
  polygon: Polygon;
  bbox: BoundingBox;
  score: number;
}

export interface DetectionConfig {
  threshold: number;
  boxThreshold: number;
  unclipRatio: number;
  maxCandidates?: number;
  minSize?: number;
}

export interface RecognitionResult {
  text: string;
  confidence: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  polygon: Polygon;
}

export interface OCRMetadata {
  executionProvider: 'webgpu' | 'wasm';
  preprocessingMs: number;
  detectionMs: number;
  recognitionMs: number;
  totalMs: number;
}

export interface OCRResponse {
  results: OCRResult[];
  metadata: OCRMetadata;
}

export interface ModelDiagnostics {
  modelName: string;
  executionProvider: 'webgpu' | 'wasm';
  inputNames: readonly string[];
  outputNames: readonly string[];
  loadTimeMs: number;
}
