// Self-contained Task 7 Redaction Policy Tests

const HIGH_RISK_CATEGORIES = new Set([
  'PASSWORD',
  'CREDIT_CARD',
  'SSN',
  'EMAIL',
  'PHONE'
]);

const MODERATE_VISUAL_CATEGORIES = new Set([
  'FACE',
  'PERSON',
  'AVATAR'
]);

const BUDGET_THRESHOLDS = {
  AGGRESSIVE_RATIO: 0.50,
  STRICT_RATIO: 0.20
};

function getBudgetMode(remaining, initial) {
  if (remaining === undefined || initial === undefined || initial <= 0) {
    return 'NORMAL';
  }
  const ratio = remaining / initial;
  if (ratio < BUDGET_THRESHOLDS.STRICT_RATIO) {
    return 'STRICT';
  }
  if (ratio < BUDGET_THRESHOLDS.AGGRESSIVE_RATIO) {
    return 'AGGRESSIVE';
  }
  return 'NORMAL';
}

function selectRedactionStrategy(region, budgetMode = 'NORMAL') {
  const cat = region.category.toUpperCase();

  // HARD INVARIANT: High-risk PII must ALWAYS be BLACK / STRICT
  if (HIGH_RISK_CATEGORIES.has(cat)) {
    return {
      regionId: region.id,
      category: cat,
      source: region.source,
      strategy: 'BLACK',
      level: 'STRICT',
      reason: 'HIGH_RISK_SAFETY_INVARIANT'
    };
  }

  // Visual categories (FACE, PERSON, AVATAR)
  if (MODERATE_VISUAL_CATEGORIES.has(cat)) {
    if (budgetMode === 'AGGRESSIVE' || budgetMode === 'STRICT') {
      return {
        regionId: region.id,
        category: cat,
        source: region.source,
        strategy: 'BLACK',
        level: 'STRICT',
        reason: `LOW_BUDGET_UPGRADE_${budgetMode}`
      };
    }
    return {
      regionId: region.id,
      category: cat,
      source: region.source,
      strategy: 'BLUR',
      level: 'MODERATE',
      reason: 'DEFAULT_VISUAL_MODERATE'
    };
  }

  if (budgetMode === 'STRICT') {
    return {
      regionId: region.id,
      category: cat,
      source: region.source,
      strategy: 'BLACK',
      level: 'STRICT',
      reason: 'CRITICAL_BUDGET_MAXIMUM_PROTECTION'
    };
  }

  return {
    regionId: region.id,
    category: cat,
    source: region.source,
    strategy: 'BLACK',
    level: 'STRICT',
    reason: 'DEFAULT_CATEGORY_POLICY'
  };
}

function applyRedactionPolicy(regions, budgetState, pageContext) {
  const remaining = budgetState?.remainingBudget ?? pageContext?.remainingBudget;
  const initial = budgetState?.initialBudget ?? pageContext?.initialBudget;
  const budgetRatio = (remaining !== undefined && initial !== undefined && initial > 0)
    ? remaining / initial
    : 1.0;

  const budgetMode = getBudgetMode(remaining, initial);
  const decisions = [];
  const counts = { strict: 0, moderate: 0, minimal: 0, black: 0, blur: 0, preserve: 0 };
  let upgradedCount = 0;

  const updatedRegions = regions.map(region => {
    const decision = selectRedactionStrategy(region, budgetMode);
    decisions.push(decision);

    if (decision.level === 'STRICT') counts.strict++;
    else if (decision.level === 'MODERATE') counts.moderate++;
    else counts.minimal++;

    if (decision.strategy === 'BLACK') counts.black++;
    else if (decision.strategy === 'BLUR') counts.blur++;
    else counts.preserve++;

    if (decision.reason.startsWith('LOW_BUDGET_UPGRADE') || decision.reason.startsWith('CRITICAL_BUDGET')) {
      upgradedCount++;
    }

    return { ...region, protection: decision.strategy };
  });

  return { updatedRegions, summary: { budgetRatio, budgetMode, counts, upgradedCount, decisions } };
}

function createRegion(id, category, source) {
  return { id, category, confidence: 1.0, bbox: { x: 10, y: 10, width: 100, height: 30 }, source, protection: 'BLACK' };
}

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING TASK 7 ADAPTIVE REDACTION POLICY TESTS");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // TEST 1: PASSWORD
  console.log("[TEST 1] Password Category Policy");
  const d1 = selectRedactionStrategy(createRegion("r1", "PASSWORD", "dom"));
  if (d1.strategy === "BLACK" && d1.level === "STRICT") {
    console.log("  ✅ Pass: PASSWORD evaluates to BLACK / STRICT.");
    passed++;
  } else { console.error("  ❌ Fail:", d1); failed++; }

  // TEST 2: EMAIL
  console.log("\n[TEST 2] Email Category Policy");
  const d2 = selectRedactionStrategy(createRegion("r2", "EMAIL", "dom"));
  if (d2.strategy === "BLACK" && d2.level === "STRICT") {
    console.log("  ✅ Pass: EMAIL evaluates to BLACK / STRICT.");
    passed++;
  } else { console.error("  ❌ Fail:", d2); failed++; }

  // TEST 3: PHONE
  console.log("\n[TEST 3] Phone Category Policy");
  const d3 = selectRedactionStrategy(createRegion("r3", "PHONE", "dom"));
  if (d3.strategy === "BLACK" && d3.level === "STRICT") {
    console.log("  ✅ Pass: PHONE evaluates to BLACK / STRICT.");
    passed++;
  } else { console.error("  ❌ Fail:", d3); failed++; }

  // TEST 4: CREDIT CARD
  console.log("\n[TEST 4] Credit Card Category Policy");
  const d4 = selectRedactionStrategy(createRegion("r4", "CREDIT_CARD", "ocr"));
  if (d4.strategy === "BLACK" && d4.level === "STRICT") {
    console.log("  ✅ Pass: CREDIT_CARD evaluates to BLACK / STRICT.");
    passed++;
  } else { console.error("  ❌ Fail:", d4); failed++; }

  // TEST 5: FACE (Normal Budget)
  console.log("\n[TEST 5] Face Category Under Normal Budget");
  const d5 = selectRedactionStrategy(createRegion("r5", "FACE", "vision"), "NORMAL");
  if (d5.strategy === "BLUR" && d5.level === "MODERATE") {
    console.log("  ✅ Pass: FACE evaluates to BLUR / MODERATE under normal budget.");
    passed++;
  } else { console.error("  ❌ Fail:", d5); failed++; }

  // TEST 6: PERSON (Normal Budget)
  console.log("\n[TEST 6] Person Category Under Normal Budget");
  const d6 = selectRedactionStrategy(createRegion("r6", "PERSON", "vision"), "NORMAL");
  if (d6.strategy === "BLUR" && d6.level === "MODERATE") {
    console.log("  ✅ Pass: PERSON evaluates to BLUR / MODERATE under normal budget.");
    passed++;
  } else { console.error("  ❌ Fail:", d6); failed++; }

  // TEST 7: AVATAR (Normal Budget)
  console.log("\n[TEST 7] Avatar Category Under Normal Budget");
  const d7 = selectRedactionStrategy(createRegion("r7", "AVATAR", "vision"), "NORMAL");
  if (d7.strategy === "BLUR" && d7.level === "MODERATE") {
    console.log("  ✅ Pass: AVATAR evaluates to BLUR / MODERATE under normal budget.");
    passed++;
  } else { console.error("  ❌ Fail:", d7); failed++; }

  // TEST 8: LOW BUDGET (Aggressive Mode, 40% remaining)
  console.log("\n[TEST 8] Low Budget Aggressive Mode (40% remaining)");
  const res8 = applyRedactionPolicy(
    [createRegion("r1", "EMAIL", "dom"), createRegion("r2", "FACE", "vision")],
    { remainingBudget: 40, initialBudget: 100 }
  );
  const email8 = res8.updatedRegions.find(r => r.id === "r1");
  const face8 = res8.updatedRegions.find(r => r.id === "r2");
  if (res8.summary.budgetMode === "AGGRESSIVE" && email8.protection === "BLACK" && face8.protection === "BLACK") {
    console.log("  ✅ Pass: Aggressive budget upgraded FACE to BLACK while EMAIL stayed BLACK.");
    passed++;
  } else { console.error("  ❌ Fail:", res8.summary); failed++; }

  // TEST 9: CRITICAL BUDGET (Strict Mode, 10% remaining)
  console.log("\n[TEST 9] Critical Budget Strict Mode (10% remaining)");
  const res9 = applyRedactionPolicy(
    [createRegion("r1", "PASSWORD", "dom"), createRegion("r2", "PERSON", "vision"), createRegion("r3", "OTHER", "dom")],
    { remainingBudget: 10, initialBudget: 100 }
  );
  const allBlack9 = res9.updatedRegions.every(r => r.protection === "BLACK");
  if (res9.summary.budgetMode === "STRICT" && allBlack9) {
    console.log("  ✅ Pass: Critical budget mode forced all sensitive regions to BLACK.");
    passed++;
  } else { console.error("  ❌ Fail:", res9.summary); failed++; }

  // TEST 10: SOURCE INDEPENDENCE
  console.log("\n[TEST 10] Source Independence (DOM vs OCR vs Vision for EMAIL)");
  const d10a = selectRedactionStrategy(createRegion("r1", "EMAIL", "dom"));
  const d10b = selectRedactionStrategy(createRegion("r2", "EMAIL", "ocr"));
  const d10c = selectRedactionStrategy(createRegion("r3", "EMAIL", "vision"));
  if (d10a.strategy === "BLACK" && d10b.strategy === "BLACK" && d10c.strategy === "BLACK") {
    console.log("  ✅ Pass: EMAIL from DOM, OCR, and Vision all resolved to BLACK.");
    passed++;
  } else { console.error("  ❌ Fail"); failed++; }

  // TEST 11: HIGH-RISK INVARIANT (High budget should NEVER downgrade high-risk PII)
  console.log("\n[TEST 11] High-Risk Protection Invariant (100% Budget)");
  const res11 = applyRedactionPolicy(
    [createRegion("r1", "PASSWORD", "dom"), createRegion("r2", "CREDIT_CARD", "ocr"), createRegion("r3", "SSN", "dom")],
    { remainingBudget: 100, initialBudget: 100 }
  );
  const allBlack11 = res11.updatedRegions.every(r => r.protection === "BLACK");
  if (res11.summary.budgetMode === "NORMAL" && allBlack11) {
    console.log("  ✅ Pass: High-risk PII remains 100% BLACK even under full budget.");
    passed++;
  } else { console.error("  ❌ Fail:", res11.summary); failed++; }

  // TEST 12: BUDGET ACCOUNTING INVARIANT
  console.log("\n[TEST 12] Budget Accounting Invariant");
  const initialBudgetState = { remainingBudget: 60, initialBudget: 100, consumedBudget: 40, totalSteps: 2, status: 'active' };
  const res12 = applyRedactionPolicy([createRegion("r1", "FACE", "vision")], initialBudgetState);
  if (initialBudgetState.remainingBudget === 60 && initialBudgetState.consumedBudget === 40) {
    console.log("  ✅ Pass: Redaction policy application did NOT mutate or alter budget accounting.");
    passed++;
  } else { console.error("  ❌ Fail"); failed++; }

  console.log("\n==========================================");
  console.log(`FINAL RESULTS: ${passed}/12 PASSED | ${failed}/12 FAILED`);
  console.log("==========================================");

  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error("Test error:", err); process.exit(1); });
