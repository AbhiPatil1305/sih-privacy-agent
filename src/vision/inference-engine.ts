import { pipeline, env } from '@xenova/transformers';
import { VisionObject } from '../shared/types';

// Configure environment to not use local weights, and use WebGPU if available
env.allowLocalModels = false;
env.useBrowserCache = true;
// @ts-ignore
if (env.backends) env.backends.onnx.wasm.numThreads = 1;

let detectorPipeline: any = null;

export async function initializeModel() {
  if (detectorPipeline) return detectorPipeline;
  
  // Using a small object detection model suitable for browsers
  console.log("Loading vision model...");
  detectorPipeline = await pipeline('object-detection', 'Xenova/detr-resnet-50', {
    // Optionally specify webgpu backend if supported by the model/environment
    // device: 'webgpu' 
  });
  console.log("Vision model loaded.");
  return detectorPipeline;
}

export async function runInference(imageUrl: string): Promise<VisionObject[]> {
  const detector = await initializeModel();
  console.log("Running inference on image...");
  // detector expects a URL or a string containing data URI
  const results = await detector(imageUrl);
  
  // Results: [{ score: 0.9, label: 'person', box: { xmin, ymin, xmax, ymax } }]
  return results.map((res: any, idx: number) => ({
    id: `vis-${idx}`,
    label: res.label,
    bbox: {
      x: res.box.xmin,
      y: res.box.ymin,
      width: res.box.xmax - res.box.xmin,
      height: res.box.ymax - res.box.ymin
    }
  }));
}
