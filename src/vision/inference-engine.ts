import { pipeline, env } from '@xenova/transformers';
import { VisionObject, VisionTelemetry } from '../shared/types';

// Configure Transformers.js environment
env.allowLocalModels = false;
env.useBrowserCache = true;
// @ts-ignore
if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
  // @ts-ignore
  env.backends.onnx.wasm.numThreads = 1;
}

export const VISION_CONFIDENCE_THRESHOLD = 0.50;
export const MODEL_NAME = 'Xenova/detr-resnet-50';

let detectorPipeline: any = null;
let modelInitLatencyMs = 0;
let detectedRuntime: 'WebGPU' | 'WASM' = 'WASM';

export async function initializeModel(): Promise<{ pipeline: any; initLatencyMs: number; runtime: 'WebGPU' | 'WASM' }> {
  if (detectorPipeline) {
    return { pipeline: detectorPipeline, initLatencyMs: modelInitLatencyMs, runtime: detectedRuntime };
  }

  const startInit = performance.now();
  console.log(`[Vision Model] Initializing local vision model (${MODEL_NAME})...`);

  // Detect WebGPU availability
  // @ts-ignore
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    detectedRuntime = 'WebGPU';
  } else {
    detectedRuntime = 'WASM';
  }

  try {
    detectorPipeline = await pipeline('object-detection', MODEL_NAME, {
      // Transformers.js auto-selects WebGPU backend if available or WASM fallback
    });
    modelInitLatencyMs = Math.round(performance.now() - startInit);
    console.log(`[Vision Model] Vision model loaded successfully in ${modelInitLatencyMs}ms (Runtime: ${detectedRuntime}).`);
    return { pipeline: detectorPipeline, initLatencyMs: modelInitLatencyMs, runtime: detectedRuntime };
  } catch (err) {
    console.error("[Vision Model] Failed to load local vision model:", err);
    throw err;
  }
}

export async function runInference(
  screenshot: Blob | string, 
  dpr: number = 1
): Promise<{ objects: VisionObject[]; telemetry: VisionTelemetry }> {
  const t0 = performance.now();
  let initTime = 0;

  try {
    const { pipeline: detector, initLatencyMs, runtime } = await initializeModel();
    initTime = initLatencyMs;

    let imageUrl: string;
    if (typeof screenshot === 'string') {
      imageUrl = screenshot;
    } else {
      imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(screenshot);
      });
    }

    console.log("[Vision Model] Running local inference on screenshot...");
    const rawResults = await detector(imageUrl, { threshold: VISION_CONFIDENCE_THRESHOLD });
    const inferenceLatencyMs = Math.round(performance.now() - t0);

    const totalDetections = rawResults.length;

    // Convert model bounding box (image pixel space) -> CSS pixel space using DPR scaling
    const objects: VisionObject[] = rawResults
      .filter((res: any) => (res.score || 0) >= VISION_CONFIDENCE_THRESHOLD)
      .map((res: any, idx: number) => {
        const xmin = res.box.xmin / dpr;
        const ymin = res.box.ymin / dpr;
        const width = (res.box.xmax - res.box.xmin) / dpr;
        const height = (res.box.ymax - res.box.ymin) / dpr;

        return {
          id: `vis-${idx + 1}`,
          label: res.label || 'sensitive_visual',
          bbox: {
            x: Math.round(xmin),
            y: Math.round(ymin),
            width: Math.round(width),
            height: Math.round(height)
          }
        };
      });

    console.log(`[Vision Model] Detected ${objects.length} sensitive visual objects (Inference: ${inferenceLatencyMs}ms).`);

    return {
      objects,
      telemetry: {
        model: MODEL_NAME,
        runtime: detectedRuntime,
        initLatencyMs: initTime,
        inferenceLatencyMs,
        totalDetections,
        acceptedDetections: objects.length
      }
    };
  } catch (err: any) {
    console.error("[Vision Model] Inference error:", err);
    return {
      objects: [],
      telemetry: {
        model: MODEL_NAME,
        runtime: detectedRuntime,
        initLatencyMs: initTime,
        inferenceLatencyMs: Math.round(performance.now() - t0),
        totalDetections: 0,
        acceptedDetections: 0,
        error: err.message || 'Vision inference failed'
      }
    };
  }
}

