import { ort } from './ort-env';
import { detectionImageToTensor, resizeForDetection } from './preprocess';
import { DEFAULT_DETECTION_CONFIG, postprocessDBNet } from './postprocess';
import type { DetectionConfig, ModelDiagnostics, TextRegion } from './types';


export class Detector {
  private session: ort.InferenceSession | null = null;
  private currentProvider: 'webgpu' | 'wasm' = 'wasm';
  private diagnostics: ModelDiagnostics | null = null;

  get isLoaded(): boolean {
    return this.session !== null;
  }

  get provider(): 'webgpu' | 'wasm' {
    return this.currentProvider;
  }

  get modelDiagnostics(): ModelDiagnostics | null {
    return this.diagnostics;
  }

  /**
   * Loads the PP-OCRv6 Tiny detection ONNX model.
   * Prefers WebGPU when available and falls back to WASM natively.
   */
  async loadDetector(
    preferredProvider: 'webgpu' | 'wasm' = 'webgpu',
    modelPath = '/models/ppocrv6_tiny_det.onnx',
    onProgress?: (message: string) => void
  ): Promise<ModelDiagnostics> {
    const startTime = performance.now();
    onProgress?.(`Fetching detector model binary from ${modelPath}...`);

    // Fetch model as ArrayBuffer to ensure clean download & progress reporting
    const response = await fetch(modelPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch detector model from ${modelPath}: HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const modelBytes = new Uint8Array(arrayBuffer);
    onProgress?.(`Detector model fetched (${(modelBytes.byteLength / 1024 / 1024).toFixed(2)} MB). Initializing session...`);

    // Check WebGPU hardware availability safely
    let useWebGPU = false;
    if (preferredProvider === 'webgpu' && typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
        const adapter = await gpu?.requestAdapter();
        if (adapter) {
          useWebGPU = true;
          onProgress?.('WebGPU hardware adapter verified.');
        } else {
          onProgress?.('WebGPU adapter not found. Falling back to WASM.');
        }
      } catch (err) {
        onProgress?.(`WebGPU adapter check failed: ${err}. Using WASM.`);
      }
    }

    const eps = useWebGPU ? ['webgpu', 'wasm'] : ['wasm'];
    onProgress?.(`Creating ONNX detector session with execution providers: [${eps.join(', ')}]...`);

    let loadedSession: ort.InferenceSession;
    let activeProvider: 'webgpu' | 'wasm' = 'wasm';

    try {
      loadedSession = await ort.InferenceSession.create(modelBytes, {
        executionProviders: eps,
        graphOptimizationLevel: 'all'
      });
      activeProvider = useWebGPU ? 'webgpu' : 'wasm';
    } catch (err) {
      if (useWebGPU) {
        onProgress?.(`WebGPU initialization error: ${err}. Falling back to WASM...`);
        loadedSession = await ort.InferenceSession.create(modelBytes, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all'
        });
        activeProvider = 'wasm';
      } else {
        throw err;
      }
    }

    this.session = loadedSession;
    this.currentProvider = activeProvider;

    const loadTimeMs = Math.round(performance.now() - startTime);

    this.diagnostics = {
      modelName: 'PP-OCRv6_tiny_det',
      executionProvider: activeProvider,
      inputNames: this.session.inputNames,
      outputNames: this.session.outputNames,
      loadTimeMs
    };

    // Diagnostics print (Section 9)
    console.log(`=== Detector Diagnostics ===`);
    console.log(`Detector loaded successfully`);
    console.log(`Execution provider: ${activeProvider.toUpperCase()}`);
    console.log(`Input names:`, this.session.inputNames);
    console.log(`Output names:`, this.session.outputNames);
    console.log(`Model load time: ${loadTimeMs} ms`);
    console.log(`============================`);

    onProgress?.(`Detector loaded successfully in ${loadTimeMs}ms (Provider: ${activeProvider.toUpperCase()})`);

    return this.diagnostics;
  }

  /**
   * Detects text regions in an input image or canvas.
   */
  async detectText(
    image: HTMLImageElement | HTMLCanvasElement,
    config: DetectionConfig = DEFAULT_DETECTION_CONFIG
  ): Promise<TextRegion[]> {
    if (!this.session) {
      throw new Error('Detector is not loaded. Call loadDetector() first.');
    }

    const origWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
    const origHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height;

    // Resize image for detection model (multiples of 32, max side 960)
    const { canvas: resizedCanvas } = resizeForDetection(image, origWidth, origHeight, 960);
    const targetW = resizedCanvas.width;
    const targetH = resizedCanvas.height;

    // Convert to CHW BGR normalized Float32Array tensor
    const { tensor, shape } = detectionImageToTensor(resizedCanvas);
    const ortTensor = new ort.Tensor('float32', tensor, shape);

    // Run inference
    const inputName = this.session.inputNames[0] || 'x';
    const feeds: Record<string, ort.Tensor> = { [inputName]: ortTensor };
    const results = await this.session.run(feeds);

    const outputName = this.session.outputNames[0];
    const outputTensor = results[outputName];
    if (!outputTensor || !(outputTensor.data instanceof Float32Array)) {
      throw new Error(`Unexpected output tensor from detector: ${outputName}`);
    }

    const probMap = outputTensor.data as Float32Array;

    // Run DBNet post-processing to obtain text regions mapped back to original image dimensions
    const regions = postprocessDBNet(
      probMap,
      targetH,
      targetW,
      origWidth,
      origHeight,
      config
    );

    return regions;
  }
}

export const defaultDetector = new Detector();

export async function loadDetector(
  preferredProvider: 'webgpu' | 'wasm' = 'webgpu',
  onProgress?: (message: string) => void
): Promise<ModelDiagnostics> {
  return defaultDetector.loadDetector(preferredProvider, '/models/ppocrv6_tiny_det.onnx', onProgress);
}

export async function detectText(
  image: HTMLImageElement | HTMLCanvasElement,
  config?: DetectionConfig
): Promise<TextRegion[]> {
  return defaultDetector.detectText(image, config);
}
