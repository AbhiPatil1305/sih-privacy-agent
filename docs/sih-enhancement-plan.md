# 🚀 SIH 2026 Enhancement & Winning Plan

**Target Problem Statement 26171**: *On-Device Visual Perception for Light-Weight Browser Agents*  
**Goal**: Elevate prototype performance and presentation to achieve top scores across all 5 SIH evaluation criteria.

---

## 📋 Comprehensive Execution Checklist

### 🇮🇳 Phase 1: Indian PII Support & Live Inspection Overlay (Target: 20% PII Recall/Precision + Demo WOW)
- [ ] **1.1 Indian PII Regex Rules** in [`src/privacy/redaction-policy.ts`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/src/privacy/redaction-policy.ts):
  - [ ] Aadhaar Number (`XXXX-XXXX-XXXX` or 12-digit sequence with optional spaces/dashes)
  - [ ] Indian PAN Card (`[A-Z]{5}[0-9]{4}[A-Z]`)
  - [ ] Indian Phone Numbers (`+91` or 10-digit starting with 6-9)
  - [ ] IFSC Code (`[A-Z]{4}0[A-Z0-9]{6}`)
  - [ ] Indian Passport Number (`[A-Z][0-9]{7}`)
- [ ] **1.2 Category Policy Alignment**: Assign solid `BLACK` mask rule to Indian PII types.
- [ ] **1.3 Content Script Live Inspector Overlay** in [`src/content/content-script.ts`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/src/content/content-script.ts):
  - [ ] Add semi-transparent SVG/Canvas debug overlay toggle.
  - [ ] Color-code bounding boxes: 🟢 **Green** = DOM Regex, 🔵 **Blue** = Vision DETR, 🔴 **Red** = OCR Text.
  - [ ] Display hover tooltip showing category label and confidence score.
- [ ] **1.4 Inspector Toggle in Sidepanel UI** in [`src/popup/App.tsx`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/src/popup/App.tsx).

---

### ⚡ Phase 2: Live Resource & Telemetry Dashboard (Target: 20% Client Resource Utilization)
- [ ] **2.1 Telemetry Collector & State Interface** in [`src/shared/types.ts`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/src/shared/types.ts):
  - [ ] Track memory heap estimate (`performance.memory`), active execution runtime (`WebGPU` vs `WASM`), init latency, inference latency, total vs accepted detections.
- [ ] **2.2 Resource Telemetry UI Component** in [`src/popup/App.tsx`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/src/popup/App.tsx):
  - [ ] Display live runtime engine status badge (`WebGPU (Accelerated)` / `WASM (Fallback)`).
  - [ ] Display memory heap meter (MB) and preprocessing latency timer (ms).
- [ ] **2.3 Interactive Vision Confidence Slider**:
  - [ ] Add slider (`0.30` to `0.80`) in Popup UI to dynamically adjust `VISION_CONFIDENCE_THRESHOLD`.

---

### 🚀 Phase 3: Parallelized Multi-Modal Perception Pipeline (Target: 15% Latency Reduction)
- [ ] **3.1 Concurrent Execution Refactoring** in [`src/privacy/visual-detector.ts`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/src/privacy/visual-detector.ts) & [`src/background/agent-loop.ts`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/src/background/agent-loop.ts):
  - [ ] Execute `runInference` (ONNX DETR Vision) and `runOCR` (Tesseract WASM) concurrently via `Promise.all()`.
  - [ ] Merge spatial results in single pass before redaction canvas paint.
- [ ] **3.2 Latency Benchmark Verification**: Measure and record percentage reduction in total client preprocessing time.

---

### 🏆 Phase 4: SIH Demo Test Suite & Presentation Verification (Target: 25% Screen Context + 100% Reliability)
- [ ] **4.1 SIH Interactive Test Fixture Page** (`public/sih-demo.html`):
  - [ ] Form with Aadhaar input, PAN input, profile photo, credit card field, and interactive submit buttons.
- [ ] **4.2 Zero-Byte Exfiltration Proof Script**:
  - [ ] Verification script confirming 0 raw image bytes leave client boundary during live demo runs.
- [ ] **4.3 Build & Compatibility Re-Verification**:
  - [ ] Verify `npm run build` (Chrome MV3) and `npm run build:firefox` (Firefox MV3).

---

## 🎯 Step-by-Step Implementation Sequence

1. **Step 1**: Implement Phase 1 (Indian PII Regexes + Category Policies + Live Inspection Overlay).
2. **Step 2**: Implement Phase 2 (Resource Telemetry Dashboard + Vision Confidence Slider).
3. **Step 3**: Implement Phase 3 (Parallel Perception Pipeline with `Promise.all`).
4. **Step 4**: Implement Phase 4 (SIH HTML Test Fixture Page + End-to-End Verification).
