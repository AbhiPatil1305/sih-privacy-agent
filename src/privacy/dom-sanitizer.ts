import { DOMElement, PrivacyRegion } from '../shared/types';
import { PII_PATTERNS } from './piiPatterns';

function boxesOverlap(
  b1: { x: number; y: number; width: number; height: number },
  b2: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    b1.x < b2.x + b2.width &&
    b1.x + b1.width > b2.x &&
    b1.y < b2.y + b2.height &&
    b1.y + b1.height > b2.y
  );
}

export function sanitizeDOM(elements: DOMElement[], regions: PrivacyRegion[]): DOMElement[] {
  const SENSITIVE_HINTS = ['email', 'password', 'phone', 'card', 'ssn', 'username', 'otp', 'pin', 'address', 'secret'];

  return elements.map(el => {
    let sanitizedLabel = el.label;
    const hintLower = `${el.nameHint || ''} ${el.idHint || ''}`.toLowerCase();

    // Check if element intersects any detected privacy region
    const intersectsPrivacyRegion = regions.some(r => boxesOverlap(el.bbox, r.bbox));

    if (intersectsPrivacyRegion || SENSITIVE_HINTS.some(h => hintLower.includes(h))) {
      if (hintLower.includes('email')) sanitizedLabel = '[REDACTED_EMAIL]';
      else if (hintLower.includes('password')) sanitizedLabel = '[REDACTED_PASSWORD]';
      else if (hintLower.includes('phone') || hintLower.includes('tel')) sanitizedLabel = '[REDACTED_PHONE]';
      else if (hintLower.includes('otp') || hintLower.includes('pin')) sanitizedLabel = '[REDACTED_OTP]';
      else if (hintLower.includes('address')) sanitizedLabel = '[REDACTED_ADDRESS]';
      else sanitizedLabel = '[REDACTED_SENSITIVE]';
    } else if (sanitizedLabel) {
      sanitizedLabel = sanitizedLabel
        .replace(PII_PATTERNS.email, '[REDACTED_EMAIL]')
        .replace(PII_PATTERNS.phone, '[REDACTED_PHONE]')
        .replace(PII_PATTERNS.creditCard, '[REDACTED_CARD]')
        .replace(PII_PATTERNS.ssn, '[REDACTED_SSN]')
        .replace(PII_PATTERNS.otp, '[REDACTED_OTP]')
        .replace(PII_PATTERNS.password, '[REDACTED_PASSWORD]')
        .replace(PII_PATTERNS.address, '[REDACTED_ADDRESS]');

      if (el.type === 'password' || el.type === 'hidden') {
        sanitizedLabel = '[REDACTED_PASSWORD]';
      }
    }

    // Strip sensitive hints so they are never leaked in payload
    let safeNameHint = el.nameHint;
    let safeIdHint = el.idHint;
    if (SENSITIVE_HINTS.some(h => hintLower.includes(h))) {
      safeNameHint = undefined;
      safeIdHint = undefined;
    }

    return {
      ...el,
      label: sanitizedLabel,
      text: sanitizedLabel ? undefined : el.text,
      nameHint: safeNameHint,
      idHint: safeIdHint
    };
  });
}
