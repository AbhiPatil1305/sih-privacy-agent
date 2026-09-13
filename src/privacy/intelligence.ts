import { DOMElement, OCRResult, PrivacyRegion } from '../shared/types';
import { PII_PATTERNS } from './piiPatterns';

export function runPrivacyIntelligence(domElements: DOMElement[], ocrResults: OCRResult[]): PrivacyRegion[] {
  const regions: PrivacyRegion[] = [];
  let regionCounter = 1;

  // 1. Process DOM
  const SENSITIVE_INPUT_TYPES = ['password', 'hidden', 'tel', 'email'];
  for (const el of domElements) {
    if (el.tag === 'input' && el.type && SENSITIVE_INPUT_TYPES.includes(el.type)) {
      let cat: PrivacyRegion['category'] = 'OTHER';
      if (el.type === 'email') cat = 'EMAIL';
      if (el.type === 'password') cat = 'PASSWORD';
      if (el.type === 'tel') cat = 'PHONE';

      regions.push({
        id: `pr_dom_${regionCounter++}`,
        bbox: el.bbox,
        category: cat,
        confidence: 1.0,
        protection: 'BLACK'
      });
    }
  }

  // 2. Process OCR
  for (const ocr of ocrResults) {
    let matchedCategory: PrivacyRegion['category'] | null = null;
    
    if (PII_PATTERNS.email.test(ocr.text)) matchedCategory = 'EMAIL';
    else if (PII_PATTERNS.phone.test(ocr.text)) matchedCategory = 'PHONE';
    else if (PII_PATTERNS.creditCard.test(ocr.text)) matchedCategory = 'OTHER'; // CARD

    if (matchedCategory) {
      regions.push({
        id: `pr_ocr_${regionCounter++}`,
        bbox: ocr.bbox,
        category: matchedCategory,
        confidence: ocr.confidence,
        protection: 'BLACK'
      });
    }
  }

  // A real fusion layer would merge overlapping boxes here

  return regions;
}
