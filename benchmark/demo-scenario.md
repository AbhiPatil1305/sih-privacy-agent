# SIH 2026 Privacy-Preserving Browser Agent — Evaluator Demonstration Scenario

## Overview
This document defines a deterministic, repeatable, 13-stage evaluator demonstration scenario for the **SIH 2026 Privacy-Preserving Browser Agent**. The scenario demonstrates how a multi-step browser task (such as form navigation and account selection) is executed while guaranteeing zero network leakage of sensitive DOM or visual PII.

> [!IMPORTANT]
> All personal data used in this scenario is strictly synthetic (`john.doe.synthetic@example.com`, `+1-555-0199`, `5555-4444-3333-2222`). No real human data is processed or transmitted.

---

## Scenario Description

- **Task Prompt**: `"Navigate to the user settings page, select the standard subscription tier, and confirm selection."`
- **Target Webpage**: `http://localhost:3000/demo-fixtures/scenario-d-mixed.html` (Synthetic Mixed DOM + Visual PII Test Page).
- **VLM Provider**: `Mock VLM` (Local server planner mode for deterministic response and zero external network dependency).

---

## Detailed 13-Stage Observability Walkthrough

### Stage 1: Target Page Load with Sensitive Information
The browser loads the target webpage containing mixed sensitive information:
- **DOM-visible PII**: Form inputs containing full name (`John Doe`), email (`john.doe.synthetic@example.com`), and phone number (`+1-555-0199`).
- **Visual-only PII**: A synthetic ID badge image rendered on an HTML5 `<canvas>` displaying an account number (`ACC-99882211`) and user photo.

---

### Stage 2: Agent Task Trigger
The evaluator enters the prompt into the Extension Popup or Audit Dashboard:
`"Navigate to the user settings page, select the standard subscription tier, and confirm selection."`

---

### Stage 3: Raw Screenshot & DOM Capture (Local Only)
The client capture module (`src/capture/screenshot.ts` and `src/capture/dom-extractor.ts`) captures:
- Raw full-page canvas screenshot buffer (`1920x1080` RGBA).
- Complete DOM element tree with line coordinates and text nodes.

---

### Stage 4: Local Multi-Modal Privacy Intelligence
The client privacy engine executes local detection across three independent engines:
1. **DOM Regex Engine**: Identifies DOM email (`john.doe.synthetic@example.com`) and phone (`+1-555-0199`).
2. **Local Vision Engine (ONNX DETR)**: Detects face/avatar region (`[x: 120, y: 340, w: 80, h: 80]`).
3. **Local OCR Engine (Tesseract Worker)**: Extends OCR bounding box over canvas ID text `ACC-99882211`.

---

### Stage 5: Multi-Modal Region Fusion
`src/privacy/fusion.ts` merges overlapping spatial boundaries across DOM, Vision, and OCR models into 4 unified `PrivacyRegion` entries with deduplicated bounding boxes and assigned risk scores.

---

### Stage 6: Privacy Budget & Adaptive Redaction Policy
- `src/privacy/privacy-budget.ts` accumulates step risk cost (35 units) against the remaining budget (100 units $\rightarrow$ 65 remaining).
- `src/privacy/redaction-policy.ts` assigns protection strategies:
  - `EMAIL` $\rightarrow$ **BLACK** (High-Risk Invariant)
  - `PHONE` $\rightarrow$ **BLACK** (High-Risk Invariant)
  - `VISUAL_PII` $\rightarrow$ **BLUR** (Medium-Risk under normal budget)
  - `PERSON / AVATAR` $\rightarrow$ **BLUR** (Medium-Risk under normal budget)

---

### Stage 7: Client-Side Screenshot & DOM Sanitization
- `src/privacy/redactor.ts` applies pixel-level solid black overlays to email/phone coordinates and Gaussian blur to visual canvas regions.
- `src/privacy/sanitizer.ts` replaces DOM PII strings with safe tokens (e.g. `[REDACTED_EMAIL_1]`).

---

### Stage 8: Network Boundary Transmission (Metadata & Sanitized Only)
`src/network/client.ts` constructs the JSON payload containing the sanitized screenshot Base64 blob and sanitized DOM nodes.
- **Verification**: The network proof inspector verifies zero instances of raw email, phone, OCR text, or raw screenshot bytes in the outgoing HTTP request body.

---

### Stage 9: Server VLM Planning
The server-side VLM planner receives the sanitized payload and emits a structured action plan:
```json
{
  "thought": "The user wants to navigate to settings. Clicking on element el_btn_settings.",
  "action": {
    "type": "click",
    "target": "el_btn_settings",
    "value": null
  },
  "step": 1,
  "status": "continue"
}
```

---

### Stage 10: Local Action Validation
Before execution, `src/background/agent-loop.ts` validates the action:
- Confirms target element `el_btn_settings` exists in current DOM.
- Confirms action type is in allowed schema (`click`, `type`, `scroll`, `wait`, `complete`).
- Checks repeated action count (0 repeats).

---

### Stage 11: Local Browser Execution
The client executes `document.querySelector('[data-agent-id="el_btn_settings"]').click()`.

---

### Stage 12: Page Settlement & Recapture
The DOM updates to the subscription settings view (`page-state-2`). The loop triggers a recapture for Step 2.

---

### Stage 13: Task Completion & Audit Trail Export
Upon reaching the final confirmation button, the VLM returns `status: "complete"`. The Extension Audit Dashboard renders:
- Total steps executed: `2`
- Final remaining budget: `30 / 100`
- Total PII regions protected: `8`
- Cumulative PII network leaks: **0**
- Audit export downloadable as `sih-privacy-audit-session.json`.

---

## Evaluator Verification Steps

To execute this demo deterministically:
1. Run `node benchmark/run-final-validation.cjs`
2. Inspect output logs for `Task 13 Demo Network Boundary: PASS`.
3. Review generated evidence in [`benchmark/results/task13-demo-validation.md`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/benchmark/results/task13-demo-validation.md).
