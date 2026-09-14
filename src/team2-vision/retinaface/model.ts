import * as ort from 'onnxruntime-web';
import type { VisionModelDiagnostics } from '../types';

export class RetinaFaceModel {
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
    modelPath = '/models/retinaface.onnx',
    preferredProvider: 'webgpu' | 'wasm' = 'webgpu',
    onProgress?: (msg: string) => void
  ): Promise<VisionModelDiagnostics> {
    const startTime = performance.now();
    onProgress?.(`Fetching RetinaFace ONNX from ${modelPath}...`);

    const resp = await fetch(modelPath);
    if (!resp.ok) {
      throw new Error(`Failed to fetch RetinaFace model from ${modelPath}: HTTP ${resp.status}`);
    }
    const arrayBuf = await resp.arrayBuffer();
    const modelBytes = new Uint8Array(arrayBuf);
    onProgress?.(`RetinaFace model loaded (${(modelBytes.byteLength / 1024 / 1024).toFixed(2)} MB). Initializing session...`);

    let useWebGPU = false;
    if (preferredProvider === 'webgpu' && typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
        const adapter = await gpu?.requestAdapter();
        if (adapter) {
          useWebGPU = true;
          onProgress?.('WebGPU hardware adapter verified for RetinaFace.');
        } else {
          onProgress?.('WebGPU adapter not available. Using WASM.');
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
        onProgress?.(`WebGPU init error: ${err}. Falling back to WASM for RetinaFace...`);
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

    const inputName = this.session.inputNames[0] || 'input';
    const outputNames: string[] = [...this.session.outputNames];

    this.diagnostics = {
      modelName: 'RetinaFace MobileNet0.25',
      inputName,
      inputShape: ['batch', 3, 'height', 'width'],
      outputNames,
      outputShapes: outputNames.map(() => ['batch', 'anchors', 'dim']),
      provider: finalProvider,
      loadTimeMs
    };

    onProgress?.(`RetinaFace session ready (${finalProvider.toUpperCase()}) in ${loadTimeMs}ms.`);
    return this.diagnostics;
  }

  async run(inputTensor: ort.Tensor): Promise<Record<string, ort.Tensor>> {
    if (!this.session) {
      throw new Error('RetinaFace model session is not loaded.');
    }
    const inputName = this.session.inputNames[0] || 'input';
    return await this.session.run({ [inputName]: inputTensor });
  }
}
