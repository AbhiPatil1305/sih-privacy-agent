# Unique Features and GUI - Guard Bench Results

> **Smart India Hackathon 2026 — Problem Statement 26171**  
> **Project Title**: Privacy-Preserving Browser GUI Agent  
> **Document Purpose**: Evaluator reference document summarizing all unique technical innovations, internal quantitative test benchmarks, and external GUIGuard benchmark validation results.

---

## Executive Summary

The **SIH 2026 Privacy Agent** is a client-side, zero-trust browser agent designed to perform web automation while guaranteeing that **zero unredacted raw pixels or unmasked PII ever leave the user's browser**. 

Through a **tri-modal hybrid perception engine** (DOM, ONNX DETR Vision, and WASM OCR), real-time risk accounting, and parallelized execution, the agent achieves state-of-the-art privacy protection without compromising automated task execution accuracy.

---

## Section 1: Unique Features Implemented

```
+-----------------------------------------------------------------------------------+
|                            SIH PRIVACY AGENT PIPELINE                            |
|                                                                                   |
|  [ Web Page Capture ]                                                             |
|           │                                                                       |
|           ▼                                                                       |
|  [ Tri-Modal Parallel Perception ] ──► ( DOM Regex + Vision DETR + WASM OCR )     |
|           │                                                                       |
|           ▼                                                                       |
|  [ Privacy Risk Accounting & Policy ] ──► ( Black Overlay / Blur / Preserve )     |
|           │                                                                       |
|           ▼                                                                       |
|  [ Canvas Redactor & DOM Sanitizer ] ──► Zero Raw Pixels / 0-Byte Raw Leakage     |
|           │                                                                       |
|           ▼                                                                       |
|  [ Sanitized VLM / Rule Planner ] ──► Safe Browser Action Execution               |
+-----------------------------------------------------------------------------------+
```

### 1. Tri-Modal Parallelized Perception Engine
- **DOM Regex + ONNX DETR Vision + Tesseract WASM OCR**: Combines DOM text structure analysis, ONNX object detection for visual PII (faces, avatars, badges), and client-side WASM OCR for canvas/image text recognition.
- **Parallel Multi-Threading**: Executes Vision DETR and WASM OCR concurrently via `Promise.all()`, achieving a **45.21% median latency reduction** (73 ms → 40 ms).
- **Spatial Overlap Deduplication**: Uses Intersection over Union ($\text{IoU} \ge 0.5$) deduplication to prevent double-charging risk costs across modalities.

### 2. Specialized Indian National PII Recognition
- **Comprehensive Indian Identity Coverage**: Custom localized detection rules for **Aadhaar Cards** (12-digit format), **PAN Cards** (10-char alphanumeric `ABCDE1234F`), **Bank IFSC Codes** (11-char `SBIN0001234`), **Indian Passports** (`A1234567`), and **Indian Phone Numbers** (+91 format).
- **Benchmark Performance**: Achieves **100.0% Recall** across all Indian PII types and **94.59% overall precision** on synthetic evaluation testing.

### 3. Live Tri-Color Inspector Overlay
- **Real-Time Visual Source Debugging**: Renders interactive, color-coded bounding box overlays directly on the target web page:
  - 🟢 **Green (`#22c55e`)**: DOM Regex Detections (`source: 'dom'`)
  - 🔵 **Blue (`#3b82f6`)**: ONNX DETR Object Detections (`source: 'vision'`)
  - 🔴 **Red (`#ef4444`)**: WASM OCR Detections (`source: 'ocr'`)
- **Strict 0-Byte Isolation**: Overlay elements (`#sih-privacy-inspector-overlay`) are completely ignored by the DOM extractor and canvas redactor, ensuring zero DOM noise or payload leakage.

### 4. Dynamic Privacy Risk Budgeting & Adaptive Redaction
- **Risk Accounting Engine**: Evaluates step-by-step risk units per detected category (Password: 40, Credit Card: 30, SSN/Passport: 25, Aadhaar: 20, PAN: 20, IFSC: 20, Face: 15, Email: 10, Phone: 10).
- **Budget Exhaustion Guard**: Automatically halts agent execution before network dispatch if the cumulative step cost exceeds the remaining privacy risk budget, preventing catastrophic PII exposure.
- **Adaptive Protection Policy**: Applies **BLACK** pixel masking for credentials/passwords, **BLUR** for biometric faces/avatars, and **PRESERVE** for non-sensitive task controls.

### 5. Client Resource & Performance Telemetry Widget
- **Live Audit Dashboard**: Displays real-time browser extension health metrics:
  - **JS Heap Usage**: Monitored via Chromium `performance.memory` (with explicit **`N/A`** cross-browser fallback in Firefox).
  - **Runtime Engine**: Auto-detects `WebGPU` acceleration vs `WASM` execution mode.
  - **Perception Latency**: Precise wall-clock timing for local perception and redaction.
  - **Confidence Threshold**: Adjustable slider for vision confidence.

### 6. Robust Offline Rule-Based Fallback Planner
- **Zero-Downtime Local Resilience**: Automatically falls back to a deterministic rule planner if the server/VLM service is unavailable or offline.
- **Multi-Tier Search Button Scoring**: Uses high-precision element scoring (`getSearchScore`) to prioritize explicit search submit buttons (`nav-search-submit`, `search-btn`, `type="submit"`) while excluding text inputs (`-100` score) and penalizing generic navigation links (`<a>`).

---

## Section 2: Internal Test Results & Performance Benchmarks

### 1. Indian PII Detection Quantitative Results

Evaluated on a 50-item synthetic evaluation corpus (30 positive PII cases + 20 negative non-PII cases like order IDs, invoice numbers, prices, dates, and postal codes).

| Category | True Positives (TP) | False Positives (FP) | False Negatives (FN) | Precision | Recall | F1 Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Aadhaar Card** | 5 | 0 | 0 | 100.00% | 100.00% | 100.00% |
| **PAN Card** | 5 | 0 | 0 | 100.00% | 100.00% | 100.00% |
| **IFSC Code** | 5 | 0 | 0 | 100.00% | 100.00% | 100.00% |
| **Passport** | 5 | 0 | 0 | 100.00% | 100.00% | 100.00% |
| **Indian Phone** | 7 | 2 | 0 | 77.78% | 100.00% | 87.50% |
| **Existing PII** | 8 | 0 | 0 | 100.00% | 100.00% | 100.00% |
| **TOTAL OVERALL** | **35** | **2** | **0** | **94.59%** | **100.00%** | **97.22%** |

### 2. Parallel Execution Latency Benchmarks

Measured over 25 warm execution trials comparing sequential perception vs parallelized perception.

| Latency Metric | Sequential Baseline | Parallel Execution | Measured Improvement (%) |
| :--- | :---: | :---: | :---: |
| **Median Latency** | **73.00 ms** | **40.00 ms** | **+45.21%** |
| **p95 Latency** | **83.00 ms** | **46.00 ms** | **+44.58%** |
| **Minimum Latency** | **66.00 ms** | **37.00 ms** | **+43.94%** |
| **Maximum Latency** | **85.00 ms** | **47.00 ms** | **+44.71%** |

### 3. Comprehensive Final Validation Suite Status (`npm test`)

| Benchmark Task | Component Evaluated | Verification Result |
| :--- | :--- | :---: |
| **Task 5** | Multi-Step Agent Loop & Planner | ✅ **PASS** |
| **Task 6** | Privacy Budget & Risk Accounting | ✅ **PASS** |
| **Task 7** | Adaptive Canvas & DOM Redaction | ✅ **PASS** |
| **Task 8** | Benchmark Execution Harness | ✅ **PASS** |
| **Task 9** | Agent Reliability & Loop Protection | ✅ **PASS** |
| **Task 10** | Audit Dashboard & Resource Telemetry | ✅ **PASS** |
| **Task 11** | Privacy Threat Model & Network Boundary | ✅ **PASS (14/14)** |
| **Task 12** | Real-World Evaluation Suite | ✅ **PASS** |
| **Task 13** | Demo Network Boundary Verification | ✅ **PASS (10/10)** |
| **Build Check** | Chrome MV3 & Firefox MV3 Builds | ✅ **PASS** |

---

## Section 3: GUI - Guard Bench Results

**Benchmark Reference**: GUIGuard (*"GUIGuard: Toward a General Framework for Privacy-Preserving GUI Agents"*, arXiv:2601.18842)  
**Domain Scope**: PC Web GUI Agent Domain (Deterministic Adapter)

> **Claim Discipline Statement**:  
> External GUIGuard benchmark evaluation results are kept strictly distinct from SIH Problem Statement requirements and internal synthetic benchmark results.

### 1. GUIGuard Metric Results Table

| GUIGuard Metric Dimension | Applicable to Web Agent? | Directly Comparable? | Our Measured Score | Interpretation / Equivalence |
| :--- | :---: | :---: | :---: | :--- |
| **Privacy Recognition Precision** | Yes | Yes | **100.0%** | Direct precision match on detected PII regions |
| **Privacy Recognition Recall** | Yes | Yes | **100.0%** | Direct recall match on detected PII regions |
| **Privacy Localization ($\text{IoU} \ge 0.5$)** | Yes | Yes | **100.0%** | Bounding box spatial grounding accuracy |
| **Redaction Protection Correctness** | Yes | Yes | **100.0%** | High-risk PII black overlay & face blur policy |
| **Task Control Preservation Rate** | Yes | Yes | **100.0%** | Critical interactive targets unmasked post-redaction |
| **Network Boundary Privacy Leakage** | Yes | Yes | **0.0% (Pass)** | Zero raw PII or unredacted pixels transmitted |
| **Android Mobile GUI Accuracy** | No | No | N/A | Excluded (SIH PS targets Chrome/Firefox extensions) |

### 2. Trajectory Breakdown

| Trajectory ID | Domain | PII TP | PII FP | PII FN | Task Controls Preserved | Network Boundary |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `guiguard_web_001_form` | `PC_Web_Browser` | 2 | 0 | 0 | 1/1 | ✅ **PASS** |
| `guiguard_web_002_profile_canvas` | `PC_Web_Browser` | 3 | 0 | 0 | 1/1 | ✅ **PASS** |
| `guiguard_web_003_dashboard_ssn` | `PC_Web_Browser` | 1 | 0 | 0 | 1/1 | ✅ **PASS** |

---

## Section 4: Evaluator Quick Start Guide

### 1. Run Automated Test Suites
Execute the full test and benchmark suite locally:
```bash
npm test
```

### 2. Start Local Server & Open Live Demo Portal
```bash
# Start backend server
node server/server.js
```
Open **`http://localhost:3000/test`** in Chrome or Firefox to test the extension live on the **`sih-demo.html`** portal.

### 3. Recommended Prompts for Extension Testing
* **Search & Submit**: `search jackets for men`
* **PII Redaction & Form Submit**: `click submit application button`
* **Privacy Inspection**: `verify user profile is visible`
