import { YOLO11Model } from './model';
import { preprocessYOLO } from './preprocess';
import { postprocessYOLO } from './postprocess';
import type { DetectionOptions, VisionResponse } from '../types';

export class YOLO11Detector {
  private model = new YOLO11Model();

  get isLoaded(): boolean {
    return this.model.isLoaded;
  }

  get provider(): 'webgpu' | 'wasm' {
    return this.model.provider;
  }

  get diagnostics() {
    return this.model.modelDiagnostics;
  }

  async load(
    preferredProvider: 'webgpu' | 'wasm' = 'webgpu',
    onProgress?: (msg: string) => void
  ) {
    return await this.model.load('/models/yolo11n.onnx', preferredProvider, onProgress);
  }

  async detect(
    image: HTMLImageElement | HTMLCanvasElement,
    options: DetectionOptions = {}
  ): Promise<VisionResponse> {
    const preferredProvider = options.preferredProvider || 'webgpu';
    let modelLoadMs = 0;

    if (!this.model.isLoaded) {
      const loadStart = performance.now();
      await this.load(preferredProvider);
      modelLoadMs = Math.round(performance.now() - loadStart);
    }

    const totalStart = performance.now();

    // Stage 1: Preprocess
    const preStart = performance.now();
    const meta = preprocessYOLO(image, 640);
    const preprocessingMs = Math.round(performance.now() - preStart);

    // Stage 2: Inference
    const infStart = performance.now();
    const outputs = await this.model.run(meta.tensor);
    const inferenceMs = Math.round(performance.now() - infStart);

    // Stage 3: Postprocess
    const postStart = performance.now();
    const outputTensor = outputs['output0'] || outputs[Object.keys(outputs)[0]];
    const outputData = outputTensor.data as Float32Array;

    const detections = postprocessYOLO(
      outputData,
      meta,
      options.confidenceThreshold ?? 0.25,
      options.iouThreshold ?? 0.45
    );
    const postprocessingMs = Math.round(performance.now() - postStart);

    const totalMs = Math.round(performance.now() - totalStart);

    return {
      detections,
      metadata: {
        model: 'YOLO11n (Ultralytics)',
        executionProvider: this.model.provider,
        modelLoadMs,
        preprocessingMs,
        inferenceMs,
        postprocessingMs,
        totalMs
      }
    };
  }
}

export const defaultYOLO11 = new YOLO11Detector();
