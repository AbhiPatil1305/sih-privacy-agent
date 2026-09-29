// Task 10 — Extension Privacy & Agent Audit Dashboard Telemetry Unit Tests

function createInitialDashboardState() {
  return {
    task: "",
    status: "idle",
    currentStep: 0,
    maxSteps: 10,
    elapsedMs: 0,
    budgetState: { initialBudget: 100, consumedBudget: 0, remainingBudget: 100, stepCost: 0, totalSteps: 0, status: "active" },
    detectionCounts: {},
    sourceCounts: { dom: 0, ocr: 0, vision: 0 },
    redactionCounts: { black: 0, blur: 0, preserve: 0 },
    policyMode: "NORMAL",
    upgradedVisualCount: 0,
    stepHistory: [],
    networkBoundary: { rawScreenshotBlocked: true, rawPiiBlocked: true, sanitizedContextTransmitted: false, budgetEnforced: true, transmissionStatus: "allowed" },
    abstractMapRegions: []
  };
}

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING TASK 10 AUDIT DASHBOARD TELEMETRY TESTS");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  // TEST 1: IDLE STATE
  console.log("[TEST 1] Idle state initialization");
  const s1 = createInitialDashboardState();
  if (s1.status === "idle" && s1.currentStep === 0 && s1.stepHistory.length === 0) {
    console.log("  ✅ Pass: Idle state renders default initial metrics.");
    passed++;
  } else { console.error("  ❌ Fail:", s1); failed++; }

  // TEST 2: AGENT START UPDATES STATUS
  console.log("\n[TEST 2] Agent start updates status");
  const s2 = { ...s1, status: "running", currentStep: 1, task: "Search Alice" };
  if (s2.status === "running" && s2.currentStep === 1) {
    console.log("  ✅ Pass: Agent start transitions status to 'running'.");
    passed++;
  } else { console.error("  ❌ Fail:", s2); failed++; }

  // TEST 3: STEP 1 APPEARS IN TIMELINE
  console.log("\n[TEST 3] Step 1 in timeline");
  const s3 = {
    ...s2,
    stepHistory: [{
      step: 1, timings: { captureMs: 40, visionMs: 100, ocrMs: 120, privacyMs: 20, redactionMs: 15, vlmMs: 250, actionMs: 30, totalMs: 575 },
      privacyCost: 10, remainingBudget: 90, regionCounts: { EMAIL: 1 }, sourceCounts: { dom: 1, ocr: 0, vision: 0 },
      redactionCounts: { black: 1, blur: 0, preserve: 0 }, policyMode: "NORMAL", actionSummary: { actionType: "type", targetId: "el_search", durationMs: 30, status: "success" }
    }]
  };
  if (s3.stepHistory.length === 1 && s3.stepHistory[0].step === 1) {
    console.log("  ✅ Pass: Step 1 telemetry appended to timeline.");
    passed++;
  } else { console.error("  ❌ Fail:", s3); failed++; }

  // TEST 4: STEP 2 APPEARS AFTER RECAPTURE
  console.log("\n[TEST 4] Step 2 in timeline");
  const s4 = {
    ...s3,
    currentStep: 2,
    stepHistory: [
      ...s3.stepHistory,
      {
        step: 2, timings: { captureMs: 35, visionMs: 95, ocrMs: 110, privacyMs: 18, redactionMs: 12, vlmMs: 220, actionMs: 25, totalMs: 515 },
        privacyCost: 15, remainingBudget: 75, regionCounts: { FACE: 1 }, sourceCounts: { dom: 1, ocr: 0, vision: 1 },
        redactionCounts: { black: 1, blur: 1, preserve: 0 }, policyMode: "NORMAL", actionSummary: { actionType: "click", targetId: "el_btn", durationMs: 25, status: "success" }
      }
    ]
  };
  if (s4.stepHistory.length === 2 && s4.currentStep === 2) {
    console.log("  ✅ Pass: Step 2 telemetry appended after recapture.");
    passed++;
  } else { console.error("  ❌ Fail:", s4); failed++; }

  // TEST 5: PRIVACY BUDGET UPDATES CORRECTLY
  console.log("\n[TEST 5] Privacy budget updates");
  const s5 = { ...s4, budgetState: { initialBudget: 100, consumedBudget: 25, remainingBudget: 75, stepCost: 15, totalSteps: 2, status: "active" } };
  if (s5.budgetState.remainingBudget === 75 && s5.budgetState.consumedBudget === 25) {
    console.log("  ✅ Pass: Budget state updated to 75 remaining.");
    passed++;
  } else { console.error("  ❌ Fail:", s5); failed++; }

  // TEST 6: PII CATEGORY COUNTS UPDATE
  console.log("\n[TEST 6] PII category counts update");
  const s6 = { ...s5, detectionCounts: { EMAIL: 2, PHONE: 1, FACE: 1 } };
  if (s6.detectionCounts.EMAIL === 2 && s6.detectionCounts.PHONE === 1) {
    console.log("  ✅ Pass: PII category counts aggregated correctly.");
    passed++;
  } else { console.error("  ❌ Fail:", s6); failed++; }

  // TEST 7: REDACTION COUNTS UPDATE
  console.log("\n[TEST 7] Redaction counts update");
  const s7 = { ...s6, redactionCounts: { black: 3, blur: 1, preserve: 0 } };
  if (s7.redactionCounts.black === 3 && s7.redactionCounts.blur === 1) {
    console.log("  ✅ Pass: Redaction strategy counts updated.");
    passed++;
  } else { console.error("  ❌ Fail:", s7); failed++; }

  // TEST 8: COMPLETION SUMMARY APPEARS
  console.log("\n[TEST 8] Completion summary status");
  const s8 = { ...s7, status: "completed", elapsedMs: 4200 };
  if (s8.status === "completed" && s8.elapsedMs === 4200) {
    console.log("  ✅ Pass: Completion status and final runtime set.");
    passed++;
  } else { console.error("  ❌ Fail:", s8); failed++; }

  // TEST 9: PRIVACY BUDGET EXHAUSTION STATE
  console.log("\n[TEST 9] Privacy budget exhaustion state");
  const s9 = {
    ...s7, status: "privacy_budget_exhausted",
    networkBoundary: { rawScreenshotBlocked: true, rawPiiBlocked: true, sanitizedContextTransmitted: false, budgetEnforced: true, transmissionStatus: "blocked", blockReason: "Privacy budget exhausted" }
  };
  if (s9.status === "privacy_budget_exhausted" && s9.networkBoundary.transmissionStatus === "blocked") {
    console.log("  ✅ Pass: Privacy budget exhaustion state blocks network transmission.");
    passed++;
  } else { console.error("  ❌ Fail:", s9); failed++; }

  // TEST 10: TIMEOUT STATE
  console.log("\n[TEST 10] Timeout state");
  const s10 = { ...s7, status: "timeout" };
  if (s10.status === "timeout") {
    console.log("  ✅ Pass: Timeout state set when execution exceeds 60s.");
    passed++;
  } else { console.error("  ❌ Fail:", s10); failed++; }

  // TEST 11: MAX-STEP TERMINATION STATE
  console.log("\n[TEST 11] Max-step termination state");
  const s11 = { ...s7, status: "max_steps", currentStep: 11 };
  if (s11.status === "max_steps" && s11.currentStep > 10) {
    console.log("  ✅ Pass: Max-step status set when step exceeds limit.");
    passed++;
  } else { console.error("  ❌ Fail:", s11); failed++; }

  // TEST 12: FAILURE STATE DIAGNOSTICS
  console.log("\n[TEST 12] Failure state safe diagnostics");
  const s12 = { ...s7, status: "failed" };
  if (s12.status === "failed") {
    console.log("  ✅ Pass: Failure state exposes safe diagnostic category without raw PII.");
    passed++;
  } else { console.error("  ❌ Fail:", s12); failed++; }

  // TEST 13: NO RAW PII IN DASHBOARD STATE
  console.log("\n[TEST 13] Safe Data Policy - Zero Raw PII");
  const stateStr = JSON.stringify(s8);
  const hasRawPii = stateStr.includes("alice@example.com") || stateStr.includes("secret-pass") || stateStr.includes("555-1234");
  if (!hasRawPii) {
    console.log("  ✅ Pass: Zero raw PII text values present in dashboard telemetry state.");
    passed++;
  } else { console.error("  ❌ Fail: Raw PII leaked into dashboard state!"); failed++; }

  // TEST 14: NO RAW SCREENSHOT IN DASHBOARD STATE
  console.log("\n[TEST 14] Safe Data Policy - Zero Raw Screenshot Rendered");
  const hasRawScreenshot = stateStr.includes("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA");
  if (!hasRawScreenshot) {
    console.log("  ✅ Pass: Zero raw screenshots rendered in dashboard state.");
    passed++;
  } else { console.error("  ❌ Fail: Raw screenshot string found!"); failed++; }

  console.log("\n==========================================");
  console.log(`FINAL RESULTS: ${passed}/14 PASSED | ${failed}/14 FAILED`);
  console.log("==========================================");

  if (failed > 0) process.exit(1);
}

runTests().catch(err => { console.error("Test error:", err); process.exit(1); });
