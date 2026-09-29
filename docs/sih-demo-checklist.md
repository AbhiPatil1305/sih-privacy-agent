# SIH 2026 Privacy-Preserving Browser Agent — Evaluator Demo Checklist

This checklist provides a step-by-step operational guide for presenting the **SIH 2026 Privacy-Preserving Browser Agent** demonstration to hackathon evaluators.

---

## 1. Before the Demo (Environment Setup & Pre-Flight Checks)

- [ ] **Install Dependencies**: Execute `npm install` to ensure all local packages are resolved.
- [ ] **Production Build**: Execute `npm run build` and verify 0 TypeScript / bundling errors.
- [ ] **Start Local Server Daemon**: Run `node server/server.js` (or `$env:VLM_PROVIDER="mock"; node server/server.js`). Confirm server responds at `http://localhost:3000/health`.
- [ ] **Load Chrome Extension**: Open Chrome `chrome://extensions`, enable Developer Mode, click "Load Unpacked", and select the `dist/` folder.
- [ ] **Open Synthetic Test Page**: Load `http://localhost:3000/demo-fixtures/scenario-d-mixed.html` in Chrome.
- [ ] **Confirm VLM Provider**: Verify server log displays `VLM_PROVIDER=mock` (or `ollama` / `openai` if live server enabled).
- [ ] **Confirm Privacy Budget System**: Open Extension Popup, verify initial budget is `100 / 100` units.
- [ ] **Confirm Network Boundary Instrumentation**: Run `node scratch/test-demo-network-boundary.cjs` to verify network interceptor is active.

---

## 2. During the Demo (Step-by-Step Evaluator Walkthrough)

- [ ] **1. Highlight Sensitive Information on Page**: Point out the synthetic DOM fields (Email, Phone, Password) and the HTML5 canvas visual ID badge.
- [ ] **2. Enter Agent Task**: Enter prompt into popup: `"Navigate to user settings, select standard tier, and confirm."`
- [ ] **3. Trigger Local Privacy Detection**: Click **Start Agent**. Point out local DOM regex, ONNX Vision, and Tesseract OCR executing in Chrome dev console logs.
- [ ] **4. Display Privacy Regions**: Show detected regions (Email, Phone, Password, Canvas OCR text, Avatar image).
- [ ] **5. Demonstrate Adaptive Redaction**: Show pixel-level **BLACK** overlays on high-risk fields (Password, Email, Phone) and **BLUR** on avatar image.
- [ ] **6. Show Remaining Visual Context**: Point out that non-sensitive UI elements (navigation bar, buttons, labels) remain 100% visible and unredacted.
- [ ] **7. Monitor Privacy Budget**: Show remaining budget updating live on popup telemetry (e.g. `100` $\rightarrow$ `65` $\rightarrow$ `30`).
- [ ] **8. Inspect Sanitized Network Payload**: Show Chrome DevTools Network tab `POST /api/plan` request payload:
  - Demonstrate presence of `[REDACTED_EMAIL_1]` tokens.
  - Demonstrate **ZERO** raw PII text values in request body.
  - Demonstrate sanitized Base64 screenshot blob.
- [ ] **9. Show Server Structured Action**: Display VLM response plan received by extension (`{ type: "click", target: "el_btn_settings" }`).
- [ ] **10. Observe Browser Execution**: Watch extension execute click action locally on Chrome active tab.
- [ ] **11. Verify Multi-Step Completion**: Watch loop repeat for Step 2 and reach final task completion (`status: "complete"`).

---

## 3. After the Demo (Evaluator Audit & Evidence Verification)

- [ ] **Show Audit Dashboard**: Open Extension Audit Dashboard (`dist/index.html`), showing step timeline, PII protection counts, and risk distribution graphs.
- [ ] **Export Audit Log**: Click **Export Audit JSON** and show downloaded `sih-privacy-audit-session.json` containing safe metadata metrics only.
- [ ] **Show Quantitative Benchmark Results**: Open [`benchmark/results/task12-evaluation.md`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/benchmark/results/task12-evaluation.md) showing measured Precision (`100%`), Recall (`100%`), and Payload Reduction (`28.87%`).
- [ ] **Run Final Validation Command**: Open terminal and execute:
  ```bash
  node benchmark/run-final-validation.cjs
  ```
  Show evaluators the 100% PASS table across all 9 regression suites and build verification.
