import { ort } from './ort-env';
import { CTCDecoder, defaultDecoder } from './decoder';
import { recognitionBatchToTensors, recognitionImageToTensor } from './preprocess';
import type { ModelDiagnostics, RecognitionResult } from './types';

export class Recognizer {
  private session: ort.InferenceSession | null = null;
  private decoder: CTCDecoder;
  private currentProvider: 'webgpu' | 'wasm' = 'wasm';
  private diagnostics: ModelDiagnostics | null = null;

  constructor(decoder = defaultDecoder) {
    this.decoder = decoder;
  }

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
   * Loads the PP-OCRv6 Tiny recognition ONNX model and dictionary.
   */
  async loadRecognizer(
    preferredProvider: 'webgpu' | 'wasm' = 'webgpu',
    modelPath = '/models/ppocrv6_tiny_rec.onnx',
    dictPath = '/models/ppocrv6_tiny_dict.txt',
    onProgress?: (message: string) => void
  ): Promise<ModelDiagnostics> {
    const startTime = performance.now();
    onProgress?.(`Loading recognition dictionary from ${dictPath}...`);

    // Load character dictionary
    await this.decoder.loadDictionary(dictPath);
    onProgress?.(`Dictionary ready (${this.decoder.dictionarySize} classes).`);

    onProgress?.(`Fetching recognizer model binary from ${modelPath}...`);
    const response = await fetch(modelPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch recognizer model from ${modelPath}: HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const modelBytes = new Uint8Array(arrayBuffer);
    onProgress?.(`Recognizer model fetched (${(modelBytes.byteLength / 1024 / 1024).toFixed(2)} MB). Initializing session...`);

    // Check WebGPU hardware availability safely
    let useWebGPU = false;
    if (preferredProvider === 'webgpu' && typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
        const adapter = await gpu?.requestAdapter();
        if (adapter) {
          useWebGPU = true;
          onProgress?.('WebGPU hardware adapter verified for recognizer.');
        } else {
          onProgress?.('WebGPU adapter not available. Using WASM for recognizer.');
        }
      } catch (err) {
        onProgress?.(`WebGPU adapter check failed: ${err}. Using WASM.`);
      }
    }

    const eps = useWebGPU ? ['webgpu', 'wasm'] : ['wasm'];
    onProgress?.(`Creating ONNX recognizer session with execution providers: [${eps.join(', ')}]...`);

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
        onProgress?.(`WebGPU initialization error: ${err}. Falling back to WASM for recognizer...`);
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
      modelName: 'PP-OCRv6_tiny_rec',
      executionProvider: activeProvider,
      inputNames: this.session.inputNames,
      outputNames: this.session.outputNames,
      loadTimeMs
    };

    console.log(`=== Recognizer Diagnostics ===`);
    console.log(`Recognizer loaded successfully`);
    console.log(`Execution provider: ${activeProvider.toUpperCase()}`);
    console.log(`Input names:`, this.session.inputNames);
    console.log(`Output names:`, this.session.outputNames);
    console.log(`Model load time: ${loadTimeMs} ms`);
    console.log(`Dictionary size: ${this.decoder.dictionarySize}`);
    console.log(`==============================`);

    onProgress?.(`Recognizer loaded successfully in ${loadTimeMs}ms (Provider: ${activeProvider.toUpperCase()})`);

    return this.diagnostics;
  }

  /**
   * Recognizes text in a cropped region canvas or ImageData.
   */
  async recognizeText(crop: HTMLCanvasElement | ImageData): Promise<RecognitionResult> {
    if (!this.session) {
      throw new Error('Recognizer is not loaded. Call loadRecognizer() first.');
    }

    // Convert crop to CHW BGR Float32Array tensor [1, 3, 48, 320]
    const { tensor, shape } = recognitionImageToTensor(crop, 48, 320);
    const ortTensor = new ort.Tensor('float32', tensor, shape);

    const inputName = this.session.inputNames[0] || 'x';
    const feeds: Record<string, ort.Tensor> = { [inputName]: ortTensor };
    const results = await this.session.run(feeds);

    const outputName = this.session.outputNames[0];
    const outputTensor = results[outputName];
    if (!outputTensor || !(outputTensor.data instanceof Float32Array)) {
      throw new Error(`Unexpected output tensor from recognizer: ${outputName}`);
    }

    const outputDims = outputTensor.dims;
    const seqLen = outputDims.length === 3 ? outputDims[1] : (outputDims[0] || 80);
    const numClasses = outputDims[outputDims.length - 1] || 6906;

    const preds = outputTensor.data as Float32Array;

    // CTC Decode
    const recResult = this.decoder.decode(preds, seqLen, numClasses);
    return recResult;
  }

  /**
   * Recognizes text for a batch of cropped text regions with configurable sub-batch size.
   * - Batch size defaults to 8 (optimal balance for GPU memory & SIMD throughput).
   * - Preserves exact 1-to-1 input crop ordering.
   * - Automatically falls back to sequential recognition if batched execution fails.
   */
  async recognizeTextBatch(
    crops: (HTMLCanvasElement | ImageData)[],
    batchSize = 8
  ): Promise<RecognitionResult[]> {
    if (!this.session) {
      throw new Error('Recognizer is not loaded. Call loadRecognizer() first.');
    }

    if (crops.length === 0) {
      return [];
    }

    // Fast-path for single crop to avoid batch array overhead
    if (crops.length === 1) {
      return [await this.recognizeText(crops[0])];
    }

    const allResults: RecognitionResult[] = [];
    const effectiveBatchSize = Math.max(1, Math.min(batchSize, 32));

    // Process in sub-batches for resource safety
    for (let start = 0; start < crops.length; start += effectiveBatchSize) {
      const end = Math.min(start + effectiveBatchSize, crops.length);
      const subBatch = crops.slice(start, end);

      try {
        const subResults = await this.executeBatchInference(subBatch);
        allResults.push(...subResults);
      } catch (err) {
        console.warn(
          `[Recognizer] Batched inference failed for batch range [${start}..${end}], gracefully falling back to sequential recognition:`,
          err
        );
        // Fall back to sequential recognition for each crop in this sub-batch
        for (const crop of subBatch) {
          const singleRes = await this.recognizeText(crop);
          allResults.push(singleRes);
        }
      }
    }

    return allResults;
  }

  /**
   * Executes a single batched inference pass for a sub-batch of crops [B, 3, 48, 320].
   */
  private async executeBatchInference(
    subBatch: (HTMLCanvasElement | ImageData)[]
  ): Promise<RecognitionResult[]> {
    if (!this.session) {
      throw new Error('Recognizer is not loaded.');
    }

    const currentBatchSize = subBatch.length;
    const { tensor, shape } = recognitionBatchToTensors(subBatch, 48, 320);
    const ortTensor = new ort.Tensor('float32', tensor, shape);

    const inputName = this.session.inputNames[0] || 'x';
    const feeds: Record<string, ort.Tensor> = { [inputName]: ortTensor };
    const results = await this.session.run(feeds);

    const outputName = this.session.outputNames[0];
    const outputTensor = results[outputName];
    if (!outputTensor || !(outputTensor.data instanceof Float32Array)) {
      throw new Error(`Unexpected output tensor from recognizer: ${outputName}`);
    }

    // Output shape: [B, seqLen, numClasses] (typically [B, 40, 6906])
    const outputDims = outputTensor.dims;
    const seqLen = outputDims.length === 3 ? outputDims[1] : (outputDims[0] || 40);
    const numClasses = outputDims[outputDims.length - 1] || 6906;
    const preds = outputTensor.data as Float32Array;

    const subResults: RecognitionResult[] = [];
    const elementsPerBatch = seqLen * numClasses;

    for (let i = 0; i < currentBatchSize; i++) {
      const startIdx = i * elementsPerBatch;
      const endIdx = startIdx + elementsPerBatch;
      const itemPreds = preds.subarray(startIdx, endIdx);

      const decoded = this.decoder.decode(itemPreds, seqLen, numClasses);
      subResults.push(decoded);
    }

    return subResults;
  }
}

export const defaultRecognizer = new Recognizer();

export async function loadRecognizer(
  preferredProvider: 'webgpu' | 'wasm' = 'webgpu',
  onProgress?: (message: string) => void
): Promise<ModelDiagnostics> {
  return defaultRecognizer.loadRecognizer(
    preferredProvider,
    '/models/ppocrv6_tiny_rec.onnx',
    '/models/ppocrv6_tiny_dict.txt',
    onProgress
  );
}

export async function recognizeText(crop: HTMLCanvasElement | ImageData): Promise<RecognitionResult> {
  return defaultRecognizer.recognizeText(crop);
}

export async function recognizeTextBatch(
  crops: (HTMLCanvasElement | ImageData)[],
  batchSize?: number
): Promise<RecognitionResult[]> {
  return defaultRecognizer.recognizeTextBatch(crops, batchSize);
}
