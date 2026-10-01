// Phase 1: Indian PII Pattern Evaluation Script (CommonJS)

const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  phone: /(?:\+91[-.\s]?)?[6-9]\d{9}|\+?\d{1,3}[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  aadhaar: /\b[2-9]{1}\d{3}[-.\s]?\d{4}[-.\s]?\d{4}\b/g,
  pan: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
  ifsc: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
  passport: /\b[A-Z][0-9]{7}\b/g,
};

function detectRegexPII(text) {
  const findings = [];
  for (const [type, regex] of Object.entries(PII_PATTERNS)) {
    // Reset regex index
    regex.lastIndex = 0;
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => findings.push({ type, match }));
    }
  }
  return findings;
}

const syntheticCorpus = [
  // Aadhaar Positives (5)
  { text: "My Aadhaar is 4532 8901 2345 for verification", category: "aadhaar", expected: true },
  { text: "UIDAI number: 9876-5432-1098", category: "aadhaar", expected: true },
  { text: "Aadhaar: 234567890123", category: "aadhaar", expected: true },
  { text: "Card no 5432-1098-7654", category: "aadhaar", expected: true },
  { text: "Identity number 8765 4321 0987", category: "aadhaar", expected: true },

  // PAN Positives (5)
  { text: "PAN Card: ABCDE1234F", category: "pan", expected: true },
  { text: "Tax ID XYZPQ9876K", category: "pan", expected: true },
  { text: "Permanent Account Number GHIJK5678L", category: "pan", expected: true },
  { text: "Income Tax MNOPQ4321R", category: "pan", expected: true },
  { text: "PAN QRSTU9999Z", category: "pan", expected: true },

  // IFSC Positives (5)
  { text: "Bank IFSC: SBIN0001234", category: "ifsc", expected: true },
  { text: "Branch HDFC0000123", category: "ifsc", expected: true },
  { text: "Code ICIC0005678", category: "ifsc", expected: true },
  { text: "IFSC PUNB0123456", category: "ifsc", expected: true },
  { text: "Routing BARB0MUMBAI", category: "ifsc", expected: true },

  // Passport Positives (5)
  { text: "Passport: Z9876543", category: "passport", expected: true },
  { text: "Travel Doc A1234567", category: "passport", expected: true },
  { text: "Passport No K8765432", category: "passport", expected: true },
  { text: "ID P5432109", category: "passport", expected: true },
  { text: "Pass M1122334", category: "passport", expected: true },

  // Indian Phone Positives (5)
  { text: "Contact me at +91 98765 43210", category: "phone", expected: true },
  { text: "Mobile: 98765 43210", category: "phone", expected: true },
  { text: "Call +919876543210 now", category: "phone", expected: true },
  { text: "Support +91 76543 21098", category: "phone", expected: true },
  { text: "Helpline 87654 32109", category: "phone", expected: true },

  // Existing PII Positives (10)
  { text: "Email: user.test@sih2026.gov.in", category: "email", expected: true },
  { text: "Contact admin@company.org", category: "email", expected: true },
  { text: "Card 4532 8901 2345 6789", category: "creditCard", expected: true },
  { text: "Visa 4111-2222-3333-4444", category: "creditCard", expected: true },
  { text: "SSN 123-45-6789", category: "ssn", expected: true },
  { text: "SSN 987-65-4321", category: "ssn", expected: true },
  { text: "US Phone 415-555-2671", category: "phone", expected: true },
  { text: "Tel +1 (555) 123-4567", category: "phone", expected: true },
  { text: "Support user@domain.com", category: "email", expected: true },
  { text: "Mastercard 5500 0000 0000 0004", category: "creditCard", expected: true },

  // Hard Negative Non-PII Cases (20)
  { text: "Order reference ORD-9928172", category: "non_pii", expected: false },
  { text: "Invoice number INV-2026-0041", category: "non_pii", expected: false },
  { text: "Total price is $199.99 USD", category: "non_pii", expected: false },
  { text: "Amount due Rs 5,499", category: "non_pii", expected: false },
  { text: "Quantity: 42 units in stock", category: "non_pii", expected: false },
  { text: "Date of report: 2026-09-30", category: "non_pii", expected: false },
  { text: "Updated on 12/04/2026", category: "non_pii", expected: false },
  { text: "PIN Code 560001 Bangalore", category: "non_pii", expected: false },
  { text: "Zip Code 90210 Beverly Hills", category: "non_pii", expected: false },
  { text: "Product SKU PROD-8821", category: "non_pii", expected: false },
  { text: "Transaction ref TXN771829", category: "non_pii", expected: false },
  { text: "Invalid Aadhaar 123456789012", category: "non_pii", expected: false }, // Starts with 1 (invalid)
  { text: "Ordinary number 1000000000", category: "non_pii", expected: false },
  { text: "Random string HEADERTEXT", category: "non_pii", expected: false },
  { text: "Config flag CONFIGVAR_TRUE", category: "non_pii", expected: false },
  { text: "Build target BUILD_TARGET_PROD", category: "non_pii", expected: false },
  { text: "Serial number S/N-99120", category: "non_pii", expected: false },
  { text: "Port number 8080", category: "non_pii", expected: false },
  { text: "HTTP Status 200 OK", category: "non_pii", expected: false },
  { text: "Dimension 1920x1080", category: "non_pii", expected: false }
];

function evaluate() {
  console.log("==========================================");
  console.log("PHASE 1: INDIAN & EXISTING PII EVALUATION");
  console.log("==========================================");

  const catMetrics = {
    aadhaar: { tp: 0, fp: 0, fn: 0 },
    pan: { tp: 0, fp: 0, fn: 0 },
    ifsc: { tp: 0, fp: 0, fn: 0 },
    passport: { tp: 0, fp: 0, fn: 0 },
    phone: { tp: 0, fp: 0, fn: 0 },
    existingPii: { tp: 0, fp: 0, fn: 0 }
  };

  let overallTp = 0, overallFp = 0, overallFn = 0;

  for (const item of syntheticCorpus) {
    const findings = detectRegexPII(item.text);
    const detected = findings.length > 0;

    if (item.expected) {
      // Positive ground truth item
      const matched = findings.some(f => {
        if (item.category === 'phone') return f.type === 'phone';
        if (item.category === 'aadhaar') return f.type === 'aadhaar';
        if (item.category === 'pan') return f.type === 'pan';
        if (item.category === 'ifsc') return f.type === 'ifsc';
        if (item.category === 'passport') return f.type === 'passport';
        return f.type === 'email' || f.type === 'creditCard' || f.type === 'ssn' || f.type === 'phone';
      });

      const catKey = ['aadhaar', 'pan', 'ifsc', 'passport', 'phone'].includes(item.category)
        ? item.category
        : 'existingPii';

      if (matched) {
        catMetrics[catKey].tp++;
        overallTp++;
      } else {
        catMetrics[catKey].fn++;
        overallFn++;
        console.log(`[FN] Missed positive: "${item.text}" (${item.category})`);
      }
    } else {
      // Negative ground truth item (Non-PII)
      if (detected) {
        overallFp++;
        console.log(`[FP] False positive on non-PII: "${item.text}" -> Detected:`, findings);
        findings.forEach(f => {
          const catKey = ['aadhaar', 'pan', 'ifsc', 'passport', 'phone'].includes(f.type)
            ? f.type
            : 'existingPii';
          if (catMetrics[catKey]) catMetrics[catKey].fp++;
        });
      }
    }
  }

  console.log("\n----------------------------------------------------------------------");
  console.log("Category     | TP | FP | FN | Precision | Recall  | F1 Score");
  console.log("----------------------------------------------------------------------");

  for (const [cat, m] of Object.entries(catMetrics)) {
    const prec = m.tp + m.fp > 0 ? (m.tp / (m.tp + m.fp)) * 100 : 100.0;
    const rec = m.tp + m.fn > 0 ? (m.tp / (m.tp + m.fn)) * 100 : 100.0;
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;
    console.log(
      `${cat.padEnd(12)} | ${String(m.tp).padStart(2)} | ${String(m.fp).padStart(2)} | ${String(m.fn).padStart(2)} | ${prec.toFixed(2).padStart(8)}% | ${rec.toFixed(2).padStart(6)}% | ${f1.toFixed(2).padStart(7)}%`
    );
  }

  const overallPrec = overallTp + overallFp > 0 ? (overallTp / (overallTp + overallFp)) * 100 : 100.0;
  const overallRec = overallTp + overallFn > 0 ? (overallTp / (overallTp + overallFn)) * 100 : 100.0;
  const overallF1 = overallPrec + overallRec > 0 ? (2 * overallPrec * overallRec) / (overallPrec + overallRec) : 0;

  console.log("----------------------------------------------------------------------");
  console.log(
    `OVERALL      | ${String(overallTp).padStart(2)} | ${String(overallFp).padStart(2)} | ${String(overallFn).padStart(2)} | ${overallPrec.toFixed(2).padStart(8)}% | ${overallRec.toFixed(2).padStart(6)}% | ${overallF1.toFixed(2).padStart(7)}%`
  );
  console.log("----------------------------------------------------------------------\n");
}

evaluate();
