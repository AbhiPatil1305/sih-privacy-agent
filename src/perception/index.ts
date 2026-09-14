import { runOCR } from '../ocr';
import type { OCRResponse } from '../ocr/types';
import { runYOLO, runRetinaFace } from '../team2-vision';
import type { VisionResponse } from '../team2-vision/types';
import type {
  PerceptionMetadata,
  PerceptionOptions,
  PerceptionResponse
} from './types';

export * from './types';

/**
 * Unified perception entry point combining PP-OCRv6 Tiny, YOLO11n, and RetinaFace.
 * Supports sequential or parallel execution across enabled pipelines.
 */
export async function runPerception(
  image: HTMLImageElement | HTMLCanvasElement,
  options: PerceptionOptions = {}
): Promise<PerceptionResponse> {
  const startTime = performance.now();

  const enableOCR = options.enableOCR ?? true;
  const enableObjects = options.enableObjects ?? true;
  const enableFaces = options.enableFaces ?? true;
  const executionMode = options.executionMode ?? 'sequential';
  const preferredProvider = options.preferredProvider;
  const batchSize = options.batchSize;

  let ocrResponse: OCRResponse | null = null;
  let yoloResponse: VisionResponse | null = null;
  let retinaResponse: VisionResponse | null = null;

  if (executionMode === 'parallel') {
    // Launch all enabled pipelines concurrently
    const [ocr, yolo, retina] = await Promise.all([
      enableOCR ? runOCR(image, { preferredProvider, batchSize }) : Promise.resolve(null),
      enableObjects ? runYOLO(image, { preferredProvider }) : Promise.resolve(null),
      enableFaces ? runRetinaFace(image, { preferredProvider }) : Promise.resolve(null)
    ]);
    ocrResponse = ocr;
    yoloResponse = yolo;
    retinaResponse = retina;
  } else {
    // Sequential execution: OCR -> YOLO11n -> RetinaFace
    if (enableOCR) {
      ocrResponse = await runOCR(image, { preferredProvider, batchSize });
    }
    if (enableObjects) {
      yoloResponse = await runYOLO(image, { preferredProvider });
    }
    if (enableFaces) {
      retinaResponse = await runRetinaFace(image, { preferredProvider });
    }
  }

  // Provider resolution: Use the provider reported by active pipelines, prioritizing OCR,
  // then YOLO, then RetinaFace, defaulting to requested or 'webgpu'.
  // Note: In heterogeneous browser environments, individual pipelines might fall back
  // independently (e.g., WebGPU initialization failure in one session falling back to WASM).
  // The executionProvider field reflects the primary active provider.
  const executionProvider =
    ocrResponse?.metadata.executionProvider ??
    yoloResponse?.metadata.executionProvider ??
    retinaResponse?.metadata.executionProvider ??
    preferredProvider ??
    'webgpu';

  const metadata: PerceptionMetadata = {
    executionProvider,
    preprocessingMs: ocrResponse?.metadata.preprocessingMs ?? 0,
    detectionMs: ocrResponse?.metadata.detectionMs ?? 0,
    recognitionMs: ocrResponse?.metadata.recognitionMs ?? 0,
    objectInferenceMs: yoloResponse?.metadata.inferenceMs ?? 0,
    faceInferenceMs: retinaResponse?.metadata.inferenceMs ?? 0,
    totalMs: performance.now() - startTime
  };

  return {
    ocr: ocrResponse ? ocrResponse.results : [],
    objects: yoloResponse ? yoloResponse.detections : [],
    faces: retinaResponse ? retinaResponse.detections : [],
    metadata
  };
}
