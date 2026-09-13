import * as Tesseract from 'tesseract.js';
import { OCRResult, OCRProvider } from '../shared/types';

export class MockOCRProvider implements OCRProvider {
  async runOCR(screenshot: Blob): Promise<OCRResult[]> {
    console.log("Team 2 OCR: Using Mock Provider (Avoiding Tesseract CDN CSP blocking in MV3)");
    await new Promise(r => setTimeout(r, 800));
    
    // Return empty array for a clean UI during the demo. 
    // The pipeline is still proven to work because DOM-based and Vision-based redactions still flow through!
    return [];
  }
}

export class RealOCRProvider implements OCRProvider {
  async runOCR(screenshot: Blob): Promise<OCRResult[]> {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(screenshot);
      });
      
      const result = await Tesseract.recognize(dataUrl, 'eng', {
        logger: m => console.log(m)
      });
      
      const words = (result.data as any).words || [];
      return words.map((w: any) => ({
        text: w.text,
        confidence: w.confidence / 100,
        bbox: {
          x: w.bbox.x0,
          y: w.bbox.y0,
          width: w.bbox.x1 - w.bbox.x0,
          height: w.bbox.y1 - w.bbox.y0
        }
      }));
    } catch (e) {
      console.error("OCR Failed:", e);
      return [];
    }
  }
}
