import * as Tesseract from 'tesseract.js';
import { OCRResult, OCRProvider, OCRTelemetry } from '../shared/types';
import { PII_PATTERNS } from '../privacy/piiPatterns';

export const OCR_CONFIDENCE_THRESHOLD = 0.50;

let cachedWorker: any = null;
let workerInitLatencyMs = 0;

export async function getTesseractWorker(): Promise<{ worker: any; initLatencyMs: number }> {
  if (cachedWorker) {
    return { worker: cachedWorker, initLatencyMs: workerInitLatencyMs };
  }

  const startInit = performance.now();
  console.log("[OCR Engine] Initializing local Tesseract.js WASM worker...");

  try {
    cachedWorker = await Tesseract.createWorker('eng', 1, {
      logger: m => console.log(`[OCR Worker] ${m.status}: ${Math.round((m.progress || 0) * 100)}%`)
    });
    workerInitLatencyMs = Math.round(performance.now() - startInit);
    console.log(`[OCR Engine] Worker initialized successfully in ${workerInitLatencyMs}ms.`);
    return { worker: cachedWorker, initLatencyMs: workerInitLatencyMs };
  } catch (err) {
    console.warn("[OCR Engine] Failed to initialize Tesseract worker (CSP or network limit):", err);
    throw err;
  }
}

export class MockOCRProvider implements OCRProvider {
  async runOCR(screenshot: Blob | string, dpr: number = 1): Promise<{ results: OCRResult[]; telemetry: OCRTelemetry }> {
    console.log("[OCR Engine] Mock Provider active.");
    return {
      results: [],
      telemetry: {
        engine: 'Mock OCR (Fast)',
        language: 'eng',
        initLatencyMs: 0,
        inferenceLatencyMs: 50,
        textSegmentsCount: 0,
        piiMatchesCount: 0
      }
    };
  }
}

export class RealOCRProvider implements OCRProvider {
  async runOCR(screenshot: Blob | string, dpr: number = 1): Promise<{ results: OCRResult[]; telemetry: OCRTelemetry }> {
    const t0 = performance.now();
    let initTime = 0;

    try {
      const { worker, initLatencyMs } = await getTesseractWorker();
      initTime = initLatencyMs;

      let dataUrl: string;
      if (typeof screenshot === 'string') {
        dataUrl = screenshot;
      } else {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(screenshot);
        });
      }

      console.log("[OCR Engine] Running local WASM text recognition...");
      const result = await worker.recognize(dataUrl);
      const inferenceLatencyMs = Math.round(performance.now() - t0);

      const words = (result.data as any).words || [];
      const textSegmentsCount = words.length;
      let piiMatchesCount = 0;

      // Convert bounding boxes from image pixel space to CSS pixel space using DPR scaling
      const results: OCRResult[] = words
        .filter((w: any) => (w.confidence / 100) >= OCR_CONFIDENCE_THRESHOLD && w.text && w.text.trim())
        .map((w: any) => {
          const normalizedText = w.text.trim();
          
          // Check if word matches sensitive PII patterns
          const isPii = PII_PATTERNS.email.test(normalizedText) ||
                        PII_PATTERNS.phone.test(normalizedText) ||
                        PII_PATTERNS.creditCard.test(normalizedText) ||
                        PII_PATTERNS.ssn.test(normalizedText);

          if (isPii) piiMatchesCount++;

          const x0 = w.bbox.x0 / dpr;
          const y0 = w.bbox.y0 / dpr;
          const width = (w.bbox.x1 - w.bbox.x0) / dpr;
          const height = (w.bbox.y1 - w.bbox.y0) / dpr;

          return {
            text: normalizedText,
            confidence: w.confidence / 100,
            bbox: {
              x: Math.round(x0),
              y: Math.round(y0),
              width: Math.round(width),
              height: Math.round(height)
            }
          };
        });

      console.log(`[OCR Engine] Recognition complete. ${results.length} text segments extracted (${piiMatchesCount} PII matches).`);

      return {
        results,
        telemetry: {
          engine: 'Tesseract.js WASM',
          language: 'eng',
          initLatencyMs: initTime,
          inferenceLatencyMs,
          textSegmentsCount,
          piiMatchesCount
        }
      };

    } catch (e: any) {
      console.warn("[OCR Engine] Fallback active: OCR engine failed or blocked by CSP, continuing with DOM/Vision privacy.", e);
      return {
        results: [],
        telemetry: {
          engine: 'Tesseract.js WASM',
          language: 'eng',
          initLatencyMs: initTime,
          inferenceLatencyMs: Math.round(performance.now() - t0),
          textSegmentsCount: 0,
          piiMatchesCount: 0,
          error: e.message || 'OCR execution failed'
        }
      };
    }
  }
}

