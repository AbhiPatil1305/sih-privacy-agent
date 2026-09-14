import { runPerception } from '../perception';
import type { OCRResult, PrivacyRegion } from '../shared/types';
import type { VisionDetection } from '../team2-vision/types';

export interface IntegratedPerceptionResult {
  ocrResults: OCRResult[];
  privacyRegions: PrivacyRegion[];
  faces: VisionDetection[];
  objects: Array<{
    id: string;
    label: string;
    classId: number;
    confidence: number;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  metadata: {
    executionProvider: 'webgpu' | 'wasm';
    totalMs: number;
    detectionMs: number;
    recognitionMs: number;
    objectInferenceMs: number;
    faceInferenceMs: number;
  };
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode screenshot Blob into an image.'));
    };

    image.src = url;
  });
}

export async function runTeam2Perception(
  screenshot: Blob,
  preferredProvider: 'webgpu' | 'wasm' = 'webgpu'
): Promise<IntegratedPerceptionResult> {
  const image = await blobToImage(screenshot);

  try {
    const perception = await runPerception(image, {
      preferredProvider,
      enableOCR: true,
      enableObjects: true,
      enableFaces: true,

      // Sequential execution is intentional.
      // Team 2's parallel ONNX execution can cause
      // "Session already started" errors.
      executionMode: 'sequential',

      // Preserve the WebGPU OCR batching optimization.
      batchSize: 8
    });

    const ocrResults: OCRResult[] = perception.ocr.map((result) => ({
      text: result.text,
      confidence: result.confidence,
      bbox: result.bbox,
      polygon: result.polygon
    }));

    const privacyRegions: PrivacyRegion[] = perception.faces.map(
      (face, index) => ({
        id: `pr_vision_face_${index + 1}`,
        bbox: face.bbox,
        category: 'FACE',
        confidence: face.confidence,
        source: 'vision',
        protection: 'BLUR'
      })
    );

    const objects = perception.objects.map((object, index) => ({
      id: `obj_${index + 1}`,
      label: object.category,
      classId: object.classId,
      confidence: object.confidence,
      bbox: object.bbox
    }));

    return {
      ocrResults,
      privacyRegions,
      faces: perception.faces,
      objects,
      metadata: {
        executionProvider: perception.metadata.executionProvider,
        totalMs: perception.metadata.totalMs,
        detectionMs: perception.metadata.detectionMs,
        recognitionMs: perception.metadata.recognitionMs,
        objectInferenceMs: perception.metadata.objectInferenceMs,
        faceInferenceMs: perception.metadata.faceInferenceMs
      }
    };
  } finally {
    image.src = '';
  }
}