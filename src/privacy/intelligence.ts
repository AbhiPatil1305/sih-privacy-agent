import { DOMElement, OCRResult, PrivacyRegion } from '../shared/types';
import { PII_PATTERNS } from './piiPatterns';

export function runPrivacyIntelligence(domElements: DOMElement[], ocrResults: OCRResult[], externalVisionRegions: PrivacyRegion[] = []): PrivacyRegion[] {
  let regions: PrivacyRegion[] = [];
  let regionCounter = 1;

  const SENSITIVE_INPUT_TYPES = ['password', 'hidden', 'tel', 'email'];
  const SENSITIVE_HINTS = ['email', 'password', 'phone', 'card', 'ssn', 'username', 'aadhaar', 'pan', 'ifsc', 'passport'];
  
  for (const el of domElements) {
    let isSensitiveStructure = false;
    let cat = 'OTHER';

    if (el.tag === 'input' && el.type && SENSITIVE_INPUT_TYPES.includes(el.type)) {
      isSensitiveStructure = true;
      if (el.type === 'email') cat = 'EMAIL';
      if (el.type === 'password') cat = 'PASSWORD';
      if (el.type === 'tel') cat = 'PHONE';
    } else if (el.tag === 'input' || el.tag === 'textarea') {
       const hintLower = `${el.nameHint || ''} ${el.idHint || ''}`.toLowerCase();
       if (SENSITIVE_HINTS.some(h => hintLower.includes(h))) {
         isSensitiveStructure = true;
         if (hintLower.includes('email')) cat = 'EMAIL';
         if (hintLower.includes('password')) cat = 'PASSWORD';
         if (hintLower.includes('phone')) cat = 'PHONE';
         if (hintLower.includes('card')) cat = 'CREDIT_CARD';
         if (hintLower.includes('ssn')) cat = 'SSN';
         if (hintLower.includes('aadhaar')) cat = 'AADHAAR';
         if (hintLower.includes('pan')) cat = 'PAN';
         if (hintLower.includes('ifsc')) cat = 'IFSC';
         if (hintLower.includes('passport')) cat = 'PASSPORT';
       }
    }

    if (isSensitiveStructure) {
      regions.push({
        id: `pr_dom_${regionCounter++}`,
        bbox: el.bbox,
        category: cat,
        confidence: 1.0,
        source: 'dom',
        protection: 'BLACK'
      });
      continue;
    }

    if (el.label) {
      let matchedCategory: string | null = null;
      if (PII_PATTERNS.email.test(el.label)) matchedCategory = 'EMAIL';
      else if (PII_PATTERNS.phone.test(el.label)) matchedCategory = 'PHONE';
      else if (PII_PATTERNS.creditCard.test(el.label)) matchedCategory = 'CREDIT_CARD';
      else if (PII_PATTERNS.ssn.test(el.label)) matchedCategory = 'SSN';
      else if (PII_PATTERNS.aadhaar.test(el.label)) matchedCategory = 'AADHAAR';
      else if (PII_PATTERNS.pan.test(el.label)) matchedCategory = 'PAN';
      else if (PII_PATTERNS.ifsc.test(el.label)) matchedCategory = 'IFSC';
      else if (PII_PATTERNS.passport.test(el.label)) matchedCategory = 'PASSPORT';

      if (matchedCategory) {
        regions.push({
          id: `pr_dom_text_${regionCounter++}`,
          bbox: el.bbox,
          category: matchedCategory,
          confidence: 1.0,
          source: 'dom',
          protection: 'BLACK'
        });
      }
    }
  }

  for (const ocr of ocrResults) {
    let matchedCategory: string | null = null;
    if (PII_PATTERNS.email.test(ocr.text)) matchedCategory = 'EMAIL';
    else if (PII_PATTERNS.phone.test(ocr.text)) matchedCategory = 'PHONE';
    else if (PII_PATTERNS.creditCard.test(ocr.text)) matchedCategory = 'CREDIT_CARD';
    else if (PII_PATTERNS.ssn.test(ocr.text)) matchedCategory = 'SSN';
    else if (PII_PATTERNS.aadhaar.test(ocr.text)) matchedCategory = 'AADHAAR';
    else if (PII_PATTERNS.pan.test(ocr.text)) matchedCategory = 'PAN';
    else if (PII_PATTERNS.ifsc.test(ocr.text)) matchedCategory = 'IFSC';
    else if (PII_PATTERNS.passport.test(ocr.text)) matchedCategory = 'PASSPORT';

    if (matchedCategory) {
      regions.push({
        id: `pr_ocr_${regionCounter++}`,
        bbox: ocr.bbox,
        category: matchedCategory,
        confidence: ocr.confidence,
        source: 'ocr',
        protection: 'BLACK'
      });
    }
  }

  regions.push(...externalVisionRegions);

  regions = regions.filter((r1, i1) => {
    if (r1.id.startsWith('pr_dom_') && !r1.id.includes('text')) return true;

    const isWrapper = regions.some((r2, i2) => {
      if (i1 === i2) return false;
      if (r1.category !== r2.category) return false;
      const r1Area = r1.bbox.width * r1.bbox.height;
      const r2Area = r2.bbox.width * r2.bbox.height;
      if (r2Area >= r1Area) return false;
      return (
        r2.bbox.x >= r1.bbox.x &&
        r2.bbox.y >= r1.bbox.y &&
        (r2.bbox.x + r2.bbox.width) <= (r1.bbox.x + r1.bbox.width) &&
        (r2.bbox.y + r2.bbox.height) <= (r1.bbox.y + r1.bbox.height)
      );
    });
    
    return !isWrapper;
  });

  return regions;
}
