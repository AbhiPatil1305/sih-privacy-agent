import { DOMElement, OCRResult, PrivacyRegion } from '../shared/types';
import { PII_PATTERNS, testPattern } from './piiPatterns';

export function runPrivacyIntelligence(
  domElements: DOMElement[],
  ocrResults: OCRResult[],
  externalVisionRegions: PrivacyRegion[] = []
): PrivacyRegion[] {
  let regions: PrivacyRegion[] = [];
  let regionCounter = 1;

  const SENSITIVE_INPUT_TYPES = ['password', 'hidden', 'tel', 'email'];
  const SENSITIVE_HINTS = ['email', 'password', 'phone', 'card', 'ssn', 'username', 'otp', 'pin', 'address', 'secret'];

  for (const el of domElements) {
    let isSensitiveStructure = false;
    let cat = 'OTHER';

    const hintLower = `${el.nameHint || ''} ${el.idHint || ''}`.toLowerCase();

    if (el.tag === 'input' && el.type && SENSITIVE_INPUT_TYPES.includes(el.type)) {
      isSensitiveStructure = true;
      if (el.type === 'email') cat = 'EMAIL';
      else if (el.type === 'password') cat = 'PASSWORD';
      else if (el.type === 'tel') cat = 'PHONE';
    } else if (SENSITIVE_HINTS.some(h => hintLower.includes(h))) {
      isSensitiveStructure = true;
      if (hintLower.includes('email')) cat = 'EMAIL';
      else if (hintLower.includes('password')) cat = 'PASSWORD';
      else if (hintLower.includes('phone') || hintLower.includes('tel')) cat = 'PHONE';
      else if (hintLower.includes('otp') || hintLower.includes('pin')) cat = 'OTP';
      else if (hintLower.includes('address')) cat = 'ADDRESS';
      else if (hintLower.includes('card')) cat = 'CARD';
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

    const textToCheck = el.label || el.text;
    if (textToCheck) {
      let matchedCategory: string | null = null;
      if (testPattern(PII_PATTERNS.email, textToCheck)) matchedCategory = 'EMAIL';
      else if (testPattern(PII_PATTERNS.phone, textToCheck)) matchedCategory = 'PHONE';
      else if (testPattern(PII_PATTERNS.otp, textToCheck)) matchedCategory = 'OTP';
      else if (testPattern(PII_PATTERNS.password, textToCheck)) matchedCategory = 'PASSWORD';
      else if (testPattern(PII_PATTERNS.address, textToCheck)) matchedCategory = 'ADDRESS';
      else if (testPattern(PII_PATTERNS.creditCard, textToCheck)) matchedCategory = 'CARD';
      else if (testPattern(PII_PATTERNS.ssn, textToCheck)) matchedCategory = 'SSN';

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
    if (testPattern(PII_PATTERNS.email, ocr.text)) matchedCategory = 'EMAIL';
    else if (testPattern(PII_PATTERNS.phone, ocr.text)) matchedCategory = 'PHONE';
    else if (testPattern(PII_PATTERNS.otp, ocr.text)) matchedCategory = 'OTP';
    else if (testPattern(PII_PATTERNS.password, ocr.text)) matchedCategory = 'PASSWORD';
    else if (testPattern(PII_PATTERNS.address, ocr.text)) matchedCategory = 'ADDRESS';
    else if (testPattern(PII_PATTERNS.creditCard, ocr.text)) matchedCategory = 'CARD';

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

  // De-duplicate overlapping wrapper regions of same category
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
