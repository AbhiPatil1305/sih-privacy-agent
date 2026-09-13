import { DOMElement, OCRResult, PrivacyRegion } from '../shared/types';
import { PII_PATTERNS } from './piiPatterns';

export function runPrivacyIntelligence(domElements: DOMElement[], ocrResults: OCRResult[]): PrivacyRegion[] {
  let regions: PrivacyRegion[] = [];
  let regionCounter = 1;

  // 1. Process DOM Elements for PII (Inputs AND Text Labels)
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
      continue;
    }

    if (el.label) {
      let matchedCategory: PrivacyRegion['category'] | null = null;
      if (PII_PATTERNS.email.test(el.label)) matchedCategory = 'EMAIL';
      else if (PII_PATTERNS.phone.test(el.label)) matchedCategory = 'PHONE';
      else if (PII_PATTERNS.creditCard.test(el.label)) matchedCategory = 'OTHER';
      else if (PII_PATTERNS.ssn.test(el.label)) matchedCategory = 'OTHER';

      if (matchedCategory) {
        regions.push({
          id: `pr_dom_text_${regionCounter++}`,
          bbox: el.bbox,
          category: matchedCategory,
          confidence: 1.0,
          protection: 'BLACK'
        });
      }
    }
  }

  // 2. Process OCR
  for (const ocr of ocrResults) {
    let matchedCategory: PrivacyRegion['category'] | null = null;
    if (PII_PATTERNS.email.test(ocr.text)) matchedCategory = 'EMAIL';
    else if (PII_PATTERNS.phone.test(ocr.text)) matchedCategory = 'PHONE';
    else if (PII_PATTERNS.creditCard.test(ocr.text)) matchedCategory = 'OTHER';

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

  // 3. Smart Geometric Filtering: 
  // Because massive parent <div> wrappers inherit their children's text, they also trigger the Regex matches.
  // We MUST drop any region that completely encapsulates a SMALLER region of the same category.
  
  regions = regions.filter((r1, i1) => {
    // Never filter out strict input fields
    if (r1.id.startsWith('pr_dom_') && !r1.id.includes('text')) return true;

    // Check if r1 is just a giant wrapper around some r2
    const isWrapper = regions.some((r2, i2) => {
      if (i1 === i2) return false;
      if (r1.category !== r2.category) return false;
      
      const r1Area = r1.bbox.width * r1.bbox.height;
      const r2Area = r2.bbox.width * r2.bbox.height;
      
      // If r2 is bigger, r1 is not its wrapper
      if (r2Area >= r1Area) return false;
      
      // Is r2 completely inside r1?
      const isInside = 
        r2.bbox.x >= r1.bbox.x &&
        r2.bbox.y >= r1.bbox.y &&
        (r2.bbox.x + r2.bbox.width) <= (r1.bbox.x + r1.bbox.width) &&
        (r2.bbox.y + r2.bbox.height) <= (r1.bbox.y + r1.bbox.height);
        
      return isInside;
    });
    
    // If it's a wrapper, drop it. We only want to redact the deepest, most accurate child element!
    return !isWrapper;
  });

  return regions;
}
