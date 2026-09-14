import { defaultDetector, loadDetector } from './detector';
import { defaultRecognizer, loadRecognizer } from './recognizer';
import { cropTextRegion } from './preprocess';
import type {
  DetectionConfig,
  ModelDiagnostics,
  OCRMetadata,
  OCRResponse,
  OCRResult
} from './types';

export * from './types';
export * from './detector';
export * from './recognizer';
export * from './preprocess';
export * from './postprocess';
export * from './decoder';

export interface RunOCROptions {
  preferredProvider?: 'webgpu' | 'wasm';
  detectionConfig?: DetectionConfig;
  batchSize?: number;
}

let isPipelineReady = false;

/**
 * Initializes both PP-OCRv6 Tiny models if they are not already loaded.
 */
export async function initOCRPipeline(
  preferredProvider: 'webgpu' | 'wasm' = 'webgpu',
  onProgress?: (msg: string) => void
): Promise<{ detector: ModelDiagnostics; recognizer: ModelDiagnostics }> {
  onProgress?.(`Starting pipeline initialization with provider: ${preferredProvider.toUpperCase()}`);

  const detDiag = await loadDetector(preferredProvider, onProgress);
  const recDiag = await loadRecognizer(preferredProvider, onProgress);

  isPipelineReady = true;
  return { detector: detDiag, recognizer: recDiag };
}

/**
 * Unified entry point for the OCR pipeline matching Milestone 1 Contract:
 *
 * 1. Image -> Preprocessing
 * 2. Detection Model -> Text Regions (Bounding Boxes)
 * 3. Crop Text Regions (4-point rectification)
 * 4. Batched Recognition Model -> Text & Confidence
 * 5. Returns OCRResponse { results: OCRResult[], metadata: OCRMetadata }
 */
export async function runOCR(
  image: HTMLImageElement | HTMLCanvasElement,
  options: RunOCROptions = {}
): Promise<OCRResponse> {
  const preferredProvider = options.preferredProvider || 'webgpu';

  // Ensure models are loaded
  if (!isPipelineReady || !defaultDetector.isLoaded || !defaultRecognizer.isLoaded) {
    await initOCRPipeline(preferredProvider);
  }

  const overallStartTime = performance.now();

  // Stage 1: Preprocessing & Detection
  const detStartTime = performance.now();
  const textRegions = await defaultDetector.detectText(image, options.detectionConfig);
  const detEndTime = performance.now();
  const detectionMs = Math.round(detEndTime - detStartTime);

  // Stage 2: 4-Point Cropping & Batched Recognition
  const recStartTime = performance.now();
  const results: OCRResult[] = [];

  if (textRegions.length > 0) {
    // Crop and rectify all detected text regions
    const crops = textRegions.map((region) =>
      cropTextRegion(image, region.polygon, region.bbox)
    );

    // Batched recognition with configurable sub-batching (default: 8)
    const batchSize = options.batchSize ?? 8;
    const recResults = await defaultRecognizer.recognizeTextBatch(crops, batchSize);

    // Maintain strict 1-to-1 input ordering
    for (let i = 0; i < textRegions.length; i++) {
      const region = textRegions[i];
      const recResult = recResults[i];
      if (!recResult) continue;

      const trimmedText = recResult.text.trim();
      if (trimmedText.length > 0) {
        results.push({
          text: trimmedText,
          confidence: recResult.confidence,
          bbox: region.bbox,
          polygon: region.polygon
        });
      }
    }
  }

  const recEndTime = performance.now();
  const recognitionMs = Math.round(recEndTime - recStartTime);

  const totalMs = Math.round(performance.now() - overallStartTime);
  const preprocessingMs = Math.max(1, totalMs - detectionMs - recognitionMs);

  const activeProvider = defaultDetector.provider;

  const metadata: OCRMetadata = {
    executionProvider: activeProvider,
    preprocessingMs,
    detectionMs,
    recognitionMs,
    totalMs
  };

  return {
    results,
    metadata
  };
}
