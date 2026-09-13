import { OCRResult, OCRProvider } from '../shared/types';
import Tesseract from 'tesseract.js';

export class RealOCRProvider implements OCRProvider {
  async runOCR(screenshot: string): Promise<OCRResult[]> {
    console.log("Team 2: Running Real Local OCR with Tesseract.js...");
    try {
      const result = await Tesseract.recognize(screenshot, 'eng', {
        logger: m => console.log(m.status, Math.round(m.progress * 100) + '%')
      });
      
      const results: OCRResult[] = [];
      
      // @ts-ignore
      if (result && result.data && result.data.words) {
        // @ts-ignore
        for (const word of result.data.words) {
          results.push({
            text: word.text,
            confidence: word.confidence / 100,
            bbox: {
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0
            }
          });
        }
      }
      
      return results;
    } catch (e) {
      console.error("OCR Failed:", e);
      return [];
    }
  }
}
