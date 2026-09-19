// Common Regex patterns for PII
export const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  phone: /\+?\d{1,3}[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  otp: /\b(?:otp[:\s]*)?\d{6}\b/gi,
  password: /(?:password[:\s]*)?(\*{6,}|[•]{6,})/gi,
  address: /\b\d{1,5}\s+[A-Za-z0-9\s,.-]+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Nagar|Marg|Circle|Sector)\b/gi,
};

export function testPattern(regex: RegExp, text: string): boolean {
  if (!text) return false;
  regex.lastIndex = 0;
  return regex.test(text);
}

export function detectRegexPII(text: string): { type: string; match: string }[] {
  const findings: { type: string; match: string }[] = [];
  if (!text) return findings;

  for (const [type, regex] of Object.entries(PII_PATTERNS)) {
    regex.lastIndex = 0;
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => findings.push({ type, match }));
    }
  }
  return findings;
}
