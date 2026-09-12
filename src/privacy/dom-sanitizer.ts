import { SafeElement, SensitiveRegion } from '../shared/types';
import { PII_PATTERNS } from './piiPatterns';

export function sanitizeDOM(elements: SafeElement[], regions: SensitiveRegion[]): SafeElement[] {
  // First, if a whole element was flagged as sensitive by our dom-detector, redact its label
  const sensitiveElementIds = new Set(
    regions.filter(r => r.source === 'dom').map(r => r.bbox) // wait, regions don't store element ID currently, just bbox.
  );
  
  return elements.map(el => {
    let sanitizedLabel = el.label;
    if (sanitizedLabel) {
      // Apply regex-based PII redaction directly on the text
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.email, '[REDACTED_EMAIL]');
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.phone, '[REDACTED_PHONE]');
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.creditCard, '[REDACTED_CARD]');
      sanitizedLabel = sanitizedLabel.replace(PII_PATTERNS.ssn, '[REDACTED_SSN]');
      
      // If the original dom-detector flagged this because it's a password input or something
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
