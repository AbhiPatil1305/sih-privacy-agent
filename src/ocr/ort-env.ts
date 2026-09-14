/**
 * ORT environment setup — single canonical module, imported once.
 * All other OCR modules import `ort` from this file to guarantee one shared instance.
 */
import * as ort from 'onnxruntime-web';

// Resolve wasm binaries from our local /public/wasm/ directory.
// Must be set before ANY InferenceSession.create() call.
ort.env.wasm.wasmPaths = '/wasm/';
ort.env.wasm.numThreads = 1;

// The proxy worker is only needed for multi-threading — disable it.
ort.env.wasm.proxy = false;

console.log('[ORT DEBUG] wasmPaths =', ort.env.wasm.wasmPaths);
console.log(
  '[ORT DEBUG] resolved WASM URL =',
  new URL(
    `${ort.env.wasm.wasmPaths}ort-wasm-simd-threaded.wasm`,
    location.href
  ).href
);
console.log('[ORT DEBUG] location.href =', location.href);
console.log('[ORT DEBUG] crossOriginIsolated =', self.crossOriginIsolated);
console.log('[ORT DEBUG] WebGPU available =', 'gpu' in navigator);

export { ort };
