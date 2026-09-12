import { SafeElement, SensitiveRegion } from '../shared/types';

const SENSITIVE_INPUT_TYPES = ['password', 'hidden', 'tel', 'email'];
const SENSITIVE_KEYWORDS = ['password', 'card', 'cvv', 'ssn', 'social security'];

export function detectSensitiveDOM(elements: SafeElement[]): SensitiveRegion[] {
  const regions: SensitiveRegion[] = [];
  
  for (const el of elements) {
    let isSensitive = false;
    let type: SensitiveRegion['type'] = 'pii';

    if (el.tag === 'input' && el.type && SENSITIVE_INPUT_TYPES.includes(el.type)) {
      isSensitive = true;
      if (el.type === 'password') type = 'password';
      if (el.type === 'tel') type = 'phone';
      if (el.type === 'email') type = 'email';
    }

    if (!isSensitive && el.label) {
      const lowerLabel = el.label.toLowerCase();
      if (SENSITIVE_KEYWORDS.some(kw => lowerLabel.includes(kw))) {
        isSensitive = true;
        if (lowerLabel.includes('password')) type = 'password';
        else if (lowerLabel.includes('card') || lowerLabel.includes('cvv')) type = 'pii';
      }
    }

    if (isSensitive) {
      regions.push({
        type,
        bbox: el.bbox,
        confidence: 1.0,
        source: 'dom'
      });
    }
  }

  return regions;
}
