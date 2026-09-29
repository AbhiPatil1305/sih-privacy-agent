import { PrivacyRegion, VisionTelemetry } from '../shared/types';
import { runInference } from '../vision/inference-engine';

const SENSITIVE_VISUAL_LABELS = ['person', 'face', 'portrait', 'avatar', 'human', 'identity card', 'passport'];

export async function detectVisualPII(
  screenshot: Blob | string, 
  dpr: number = 1
): Promise<{ regions: PrivacyRegion[]; telemetry: VisionTelemetry }> {
  try {
    const { objects, telemetry } = await runInference(screenshot, dpr);

    let regionCounter = 1;
    const regions: PrivacyRegion[] = objects.map((obj) => {
      const isPerson = SENSITIVE_VISUAL_LABELS.includes(obj.label.toLowerCase());
      return {
        id: `pr_vision_${regionCounter++}`,
        category: isPerson ? 'PERSON' : 'VISUAL_PII',
        confidence: 0.90,
        bbox: obj.bbox,
        source: 'vision',
        protection: isPerson ? 'BLUR' : 'BLACK'
      };
    });

    return { regions, telemetry };

  } catch (err: any) {
    console.warn("[Visual Detector] Fallback active: Vision inference failed, continuing with DOM/regex privacy.", err);
    return {
      regions: [],
      telemetry: {
        model: 'Xenova/detr-resnet-50',
        runtime: 'WASM',
        initLatencyMs: 0,
        inferenceLatencyMs: 0,
        totalDetections: 0,
        acceptedDetections: 0,
        error: err.message || 'Vision model error'
      }
    };
  }
}

