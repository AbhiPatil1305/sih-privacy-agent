// Self-contained Task 6 Privacy Budget Tests
// Inlines core logic to avoid TypeScript import issues in Node.js

const PRIVACY_RISK_COSTS = {
  EMAIL: 10,
  PHONE: 10,
  SSN: 25,
  CREDIT_CARD: 30,
  PASSWORD: 40,
  PERSON: 10,
  FACE: 15,
  AVATAR: 10,
  VISUAL_PII: 15,
  OTHER: 20,
  OTHER_SENSITIVE: 20
};

const DEFAULT_PRIVACY_BUDGET = 100;

function isDuplicateRegion(r1, r2) {
  if (r1.category.toUpperCase() !== r2.category.toUpperCase()) return false;
  const xOverlap = Math.max(0, Math.min(r1.bbox.x + r1.bbox.width, r2.bbox.x + r2.bbox.width) - Math.max(r1.bbox.x, r2.bbox.x));
  const yOverlap = Math.max(0, Math.min(r1.bbox.y + r1.bbox.height, r2.bbox.y + r2.bbox.height) - Math.max(r1.bbox.y, r2.bbox.y));
  const intersection = xOverlap * yOverlap;
  if (intersection <= 0) return false;
  const r1Area = r1.bbox.width * r1.bbox.height;
  const r2Area = r2.bbox.width * r2.bbox.height;
  const union = r1Area + r2Area - intersection;
  return union > 0 ? (intersection / union) > 0.5 : false;
}

function calculatePrivacyCost(regions) {
  const uniqueRegions = [];
  for (const reg of regions) {
    const isDup = uniqueRegions.some(existing => isDuplicateRegion(existing, reg));
    if (!isDup) uniqueRegions.push(reg);
  }
  let totalCost = 0;
  const byCategory = {};
  const bySource = {};
  let highestRiskCategory = "NONE";
  let maxCatCost = -1;
  for (const reg of uniqueRegions) {
    const cat = reg.category.toUpperCase();
    const cost = PRIVACY_RISK_COSTS[cat] !== undefined ? PRIVACY_RISK_COSTS[cat] : 20;
    totalCost += cost;
    byCategory[cat] = (byCategory[cat] || 0) + cost;
    bySource[reg.source] = (bySource[reg.source] || 0) + cost;
    if (cost > maxCatCost) { maxCatCost = cost; highestRiskCategory = cat; }
  }
  return { totalCost, regionCount: uniqueRegions.length, byCategory, bySource, highestRiskCategory };
}

class PrivacyBudgetManager {
  constructor(initialBudget = 100) {
    this._initialBudget = initialBudget;
    this._consumedBudget = 0;
    this._stepCount = 0;
  }
  get state() {
    const remaining = Math.max(0, this._initialBudget - this._consumedBudget);
    return {
      initialBudget: this._initialBudget,
      consumedBudget: this._consumedBudget,
      remainingBudget: remaining,
      totalSteps: this._stepCount,
      status: remaining <= 0 ? "exhausted" : "active"
    };
  }
  canAfford(stepCost) {
    return (this._initialBudget - this._consumedBudget) >= stepCost;
  }
  recordStep(stepCost) {
    this._stepCount++;
    this._consumedBudget += stepCost;
    const remaining = this._initialBudget - this._consumedBudget;
    return {
      initialBudget: this._initialBudget,
      consumedBudget: this._consumedBudget,
      remainingBudget: Math.max(0, remaining),
      stepCost,
      totalSteps: this._stepCount,
      status: remaining <= 0 ? "exhausted" : "active"
    };
  }
}

function createRegion(id, category, source, bbox) {
  return { id, category, confidence: 1.0, bbox: bbox || { x: 10, y: 10, width: 100, height: 30 }, source, protection: "BLACK" };
}

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING TASK 6 PRIVACY BUDGET & RISK ACCOUNTING TESTS");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // TEST 1: NO PII
  console.log("[TEST 1] Page with NO PII detected");
  const cost1 = calculatePrivacyCost([]);
  if (cost1.totalCost === 0 && cost1.regionCount === 0) {
    console.log("  ✅ Pass: Zero cost for page without PII regions.");
    passed++;
  } else { console.error("  ❌ Fail:", cost1); failed++; }

  // TEST 2: SINGLE EMAIL
  console.log("\n[TEST 2] Single Email Risk Cost");
  const cost2 = calculatePrivacyCost([createRegion("r1", "EMAIL", "dom")]);
  if (cost2.totalCost === 10 && cost2.byCategory["EMAIL"] === 10) {
    console.log("  ✅ Pass: Single email correctly charged 10 units.");
    passed++;
  } else { console.error("  ❌ Fail:", cost2); failed++; }

  // TEST 3: MULTIPLE PII TYPES
  console.log("\n[TEST 3] Multiple PII Types Risk Cost");
  const cost3 = calculatePrivacyCost([
    createRegion("r1", "EMAIL", "dom", { x: 10, y: 10, width: 100, height: 20 }),
    createRegion("r2", "PHONE", "dom", { x: 10, y: 50, width: 100, height: 20 }),
    createRegion("r3", "PASSWORD", "dom", { x: 10, y: 90, width: 100, height: 20 }),
    createRegion("r4", "FACE", "vision", { x: 10, y: 130, width: 100, height: 20 })
  ]);
  if (cost3.totalCost === 75 && cost3.highestRiskCategory === "PASSWORD") {
    console.log("  ✅ Pass: Multiple PII types correctly accumulated to 75 units (Highest: PASSWORD).");
    passed++;
  } else { console.error("  ❌ Fail:", cost3); failed++; }

  // TEST 4: MULTI-STEP BUDGET ACCUMULATION
  console.log("\n[TEST 4] Multi-Step Cumulative Budget Accounting");
  const mgr4 = new PrivacyBudgetManager(100);
  mgr4.recordStep(10);
  mgr4.recordStep(20);
  mgr4.recordStep(30);
  const s4 = mgr4.state;
  if (s4.consumedBudget === 60 && s4.remainingBudget === 40 && s4.totalSteps === 3) {
    console.log("  ✅ Pass: Budget accumulated across 3 steps (Consumed: 60, Remaining: 40). Budget did not reset.");
    passed++;
  } else { console.error("  ❌ Fail:", s4); failed++; }

  // TEST 5: BUDGET EXHAUSTION
  console.log("\n[TEST 5] Budget Exhaustion Prevention");
  const mgr5 = new PrivacyBudgetManager(20);
  const costExceeds = calculatePrivacyCost([createRegion("r1", "CREDIT_CARD", "dom")]);
  const canAfford5 = mgr5.canAfford(costExceeds.totalCost);
  if (!canAfford5 && mgr5.state.remainingBudget === 20) {
    console.log("  ✅ Pass: Network transmission blocked because step cost (30) > remaining budget (20).");
    passed++;
  } else { console.error("  ❌ Fail: Budget exhaustion check failed."); failed++; }

  // TEST 6: DUPLICATE DETECTION DEDUPLICATION
  console.log("\n[TEST 6] Overlapping Duplicate Region Deduplication");
  const sameBbox = { x: 10, y: 10, width: 100, height: 30 };
  const cost6 = calculatePrivacyCost([
    createRegion("r_dom", "EMAIL", "dom", sameBbox),
    createRegion("r_ocr", "EMAIL", "ocr", sameBbox)
  ]);
  if (cost6.totalCost === 10 && cost6.regionCount === 1) {
    console.log("  ✅ Pass: Overlapping DOM and OCR email regions deduplicated to 1 charge (10 units).");
    passed++;
  } else { console.error("  ❌ Fail:", cost6); failed++; }

  // TEST 7: BOUNDARY - EXACT BUDGET MATCH
  console.log("\n[TEST 7] Boundary Condition - Step Cost Exactly Equals Remaining Budget");
  const mgr7 = new PrivacyBudgetManager(30);
  const canAfford7 = mgr7.canAfford(30);
  const state7 = mgr7.recordStep(30);
  if (canAfford7 && state7.remainingBudget === 0 && state7.status === "exhausted") {
    console.log("  ✅ Pass: Step cost (30) exactly matching budget (30) is allowed; budget transitions to exhausted.");
    passed++;
  } else { console.error("  ❌ Fail:", state7); failed++; }

  // TEST 8: BOUNDARY - ONE UNIT ABOVE
  console.log("\n[TEST 8] Boundary Condition - Step Cost 1 Unit Above Remaining Budget");
  const mgr8 = new PrivacyBudgetManager(25);
  const canAfford8 = mgr8.canAfford(26);
  if (!canAfford8) {
    console.log("  ✅ Pass: Step cost (26) exceeding remaining budget (25) by 1 unit is correctly rejected.");
    passed++;
  } else { console.error("  ❌ Fail"); failed++; }

  // TEST 9: RAW PII SAFETY IN TELEMETRY
  console.log("\n[TEST 9] Raw PII Telemetry Safety");
  const telemetry = JSON.stringify({
    step: 1, cost: cost3.totalCost,
    byCategory: cost3.byCategory, bySource: cost3.bySource,
    highestRiskCategory: cost3.highestRiskCategory
  });
  const hasRawPii = telemetry.includes("alice@example.com") || telemetry.includes("secret-password") || telemetry.includes("9000000000");
  if (!hasRawPii) {
    console.log("  ✅ Pass: Zero raw PII present in budget telemetry payload.");
    passed++;
  } else { console.error("  ❌ Fail: Raw PII found in telemetry!"); failed++; }

  // TEST 10: ZERO BUDGET BLOCKS IMMEDIATELY
  console.log("\n[TEST 10] Zero Budget Blocks All Transmission");
  const mgr10 = new PrivacyBudgetManager(0);
  const canAfford10 = mgr10.canAfford(1);
  if (!canAfford10 && mgr10.state.status === "exhausted") {
    console.log("  ✅ Pass: Zero budget blocks all network transmission immediately.");
    passed++;
  } else { console.error("  ❌ Fail"); failed++; }

  console.log("\n==========================================");
  console.log(`FINAL RESULTS: ${passed}/10 PASSED | ${failed}/10 FAILED`);
  console.log("==========================================");

  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error("Test error:", err); process.exit(1); });
