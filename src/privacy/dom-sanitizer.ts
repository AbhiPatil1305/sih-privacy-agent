import { DOMElement, PrivacyRegion } from '../shared/types';
import { PII_PATTERNS } from './piiPatterns';

export function sanitizeDOM(elements: DOMElement[], regions: PrivacyRegion[]): DOMElement[] {
  return elements.map(el => {
    let sanitizedLabel = el.label;
    if (sanitizedLabel) {
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.email, '[REDACTED_EMAIL]');
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.phone, '[REDACTED_PHONE]');
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.creditCard, '[REDACTED_CARD]');
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.ssn, '[REDACTED_SSN]');
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.aadhaar, '[REDACTED_AADHAAR]');
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.pan, '[REDACTED_PAN]');
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.ifsc, '[REDACTED_IFSC]');
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.passport, '[REDACTED_PASSPORT]');
      
      if (el.type === 'password' || el.type === 'hidden') {
         sanitizedLabel = '[REDACTED_PASSWORD]';
      }
    }
    
    return {
      ...el,
      label: sanitizedLabel
    };
  });
}
