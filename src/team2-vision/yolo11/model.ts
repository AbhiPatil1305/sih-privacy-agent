import * as ort from 'onnxruntime-web';
import type { VisionModelDiagnostics } from '../types';

export class YOLO11Model {
  private session: ort.InferenceSession | null = null;
  private activeProvider: 'webgpu' | 'wasm' = 'wasm';
  private diagnostics: VisionModelDiagnostics | null = null;

  get isLoaded(): boolean {
    return this.session !== null;
  }

  get provider(): 'webgpu' | 'wasm' {
    return this.activeProvider;
  }

  get modelDiagnostics(): VisionModelDiagnostics | null {
    return this.diagnostics;
  }

  async load(
    modelPath = '/models/yolo11n.onnx',
    preferredProvider: 'webgpu' | 'wasm' = 'webgpu',
    onProgress?: (msg: string) => void
  ): Promise<VisionModelDiagnostics> {
    const startTime = performance.now();
    onProgress?.(`Fetching YOLO11n ONNX from ${modelPath}...`);

    const resp = await fetch(modelPath);
    if (!resp.ok) {
      throw new Error(`Failed to fetch YOLO11n model from ${modelPath}: HTTP ${resp.status}`);
    }
    const arrayBuf = await resp.arrayBuffer();
    const modelBytes = new Uint8Array(arrayBuf);
    onProgress?.(`YOLO11n model fetched (${(modelBytes.byteLength / 1024 / 1024).toFixed(2)} MB). Initializing session...`);

    let useWebGPU = false;
    if (preferredProvider === 'webgpu' && typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
        const adapter = await gpu?.requestAdapter();
        if (adapter) {
          useWebGPU = true;
          onProgress?.('WebGPU hardware adapter verified for YOLO11n.');
        } else {
          onProgress?.('WebGPU adapter not available. Using WASM for YOLO11n.');
        }
      } catch (err) {
        onProgress?.(`WebGPU probe failed: ${err}. Using WASM.`);
      }
    }

    const providers = useWebGPU ? ['webgpu', 'wasm'] : ['wasm'];
    let loadedSession: ort.InferenceSession;
    let finalProvider: 'webgpu' | 'wasm' = 'wasm';

    try {
      loadedSession = await ort.InferenceSession.create(modelBytes, {
        executionProviders: providers,
        graphOptimizationLevel: 'all'
      });
      finalProvider = useWebGPU ? 'webgpu' : 'wasm';
    } catch (err) {
      if (useWebGPU) {
        onProgress?.(`WebGPU init error: ${err}. Falling back to WASM for YOLO11n...`);
        loadedSession = await ort.InferenceSession.create(modelBytes, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all'
        });
        finalProvider = 'wasm';
      } else {
        throw err;
      }
    }

    this.session = loadedSession;
    this.activeProvider = finalProvider;

    const loadTimeMs = Math.round(performance.now() - startTime);

    const inputName = this.session.inputNames[0] || 'images';
    const outputNames: string[] = [...this.session.outputNames];

    this.diagnostics = {
      modelName: 'YOLO11n (Ultralytics)',
      inputName,
      inputShape: [1, 3, 640, 640],
      outputNames,
      outputShapes: [[1, 84, 8400]],
      provider: finalProvider,
      loadTimeMs
    };

    onProgress?.(`YOLO11n session ready (${finalProvider.toUpperCase()}) in ${loadTimeMs}ms.`);
    return this.diagnostics;
  }

  async run(inputTensor: ort.Tensor): Promise<Record<string, ort.Tensor>> {
    if (!this.session) {
      throw new Error('YOLO11n model session is not loaded.');
    }
    const inputName = this.session.inputNames[0] || 'images';
    return await this.session.run({ [inputName]: inputTensor });
  }
}
