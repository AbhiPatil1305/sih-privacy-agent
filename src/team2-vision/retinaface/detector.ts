import { RetinaFaceModel } from './model';
import { preprocessRetinaFace } from './preprocess';
import { postprocessRetinaFace } from './postprocess';
import type { DetectionOptions, VisionResponse } from '../types';

export class RetinaFaceDetector {
  private model = new RetinaFaceModel();

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
    return await this.model.load('/models/retinaface.onnx', preferredProvider, onProgress);
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
    const meta = preprocessRetinaFace(image, 640);
    const preprocessingMs = Math.round(performance.now() - preStart);

    // Stage 2: Inference
    const infStart = performance.now();
    const outputs = await this.model.run(meta.tensor);
    const inferenceMs = Math.round(performance.now() - infStart);

    // Stage 3: Postprocess
    const postStart = performance.now();
    const locTensor = outputs['loc'] || outputs[Object.keys(outputs)[0]];
    const confTensor = outputs['conf'] || outputs[Object.keys(outputs)[1]];

    const locData = locTensor.data as Float32Array;
    const confData = confTensor.data as Float32Array;

    const detections = postprocessRetinaFace(
      locData,
      confData,
      meta,
      options.confidenceThreshold ?? 0.5,
      options.iouThreshold ?? 0.4
    );
    const postprocessingMs = Math.round(performance.now() - postStart);

    const totalMs = Math.round(performance.now() - totalStart);

    return {
      detections,
      metadata: {
        model: 'RetinaFace MobileNet0.25',
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

export const defaultRetinaFace = new RetinaFaceDetector();
