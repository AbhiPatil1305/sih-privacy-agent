import { OCRResult, OCRProvider } from '../shared/types';

export class MockOCRProvider implements OCRProvider {
  async runOCR(screenshot: string): Promise<OCRResult[]> {
    console.log("Team 2: Running Mock OCR on screenshot...");
    // Simulating an OCR detection finding an email
    // Note: In a real integration, OCR coordinates (device pixels) must be converted to CSS pixels if they aren't already.
    return [
      {
        text: "rahul@example.com",
        confidence: 0.98,
        bbox: {
          x: 420,
          y: 300,
          width: 180,
          height: 30
        }
      }
    ];
  }
}
