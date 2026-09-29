# Master SIH 2026 Evidence & Claim Matrix

## Executive Summary

This document establishes the single authoritative evidence and claim matrix for the **SIH 2026 Privacy-Preserving Browser Agent with On-Device Visual Perception**.

It defines exact, evidence-backed boundaries for:
- What can be safely claimed to an SIH evaluator.
- The exact empirical measurements supporting each claim.
- The population, environment, and evidence type for every metric.
- Required qualifications and limitations that must be disclosed.
- Explicitly prohibited claims that must never be spoken.

---

## 1. Master Evidence & Claim Matrix

| Claim | Evidence Source | Exact Measurement | Population / Scope | Evidence Type | Safe Evaluator Wording | Limitation / Disclosure |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Chrome Extension Architecture** | Task 1, 3, 14 | Manifest V3 build (`dist/manifest.json`), active background worker, popup, DOM content script | 1 Chrome browser extension | Architectural / Build | *"Implemented and validated as a Chrome Manifest V3 extension."* | Requires Chrome MV3 extension permissions. |
| **Firefox Compatibility** | Task 15, 17 | `package.json` (`build:firefox`), Manifest V2 fallback, Gecko ID in manifest | 1 Firefox build package | Build & Package Validation | *"Firefox-compatible build/package validated; Firefox runtime execution was not available in the current environment."* | Packaging validated; live Firefox browser execution was not tested in context. |
| **Local Visual Perception** | Task 2, 4, 16 | Local DETR vision model ($640 \times 640$ canvas), local Tesseract WASM OCR | On-device Wasm/JS inference | Architectural & Empirical | *"Visual perception and OCR run 100% on-device before any network request."* | OCR latency depends on client CPU/Wasm execution. |
| **Privacy-Preserving Filtering** | Task 4, 5, 12, 17 | Multimodal fusion (`runPrivacyIntelligence`), DOM PII detector, adaptive redaction | 13 internal scenarios (Task 12 + 17) | Empirical Test Result | *"Privacy layer detects PII via DOM structure and visual OCR before masking."* | DOM structural rules require HTML input attributes. |
| **Sanitization Before Transmission** | Task 5, 10, 11 | Canvas context redactor (`applyRedactionPolicy`), 0 raw screenshot bytes exfiltrated | 14 security test suites (Task 11) | Architectural & Security Audit | *"Raw screenshots and unmasked PII never leave the local client."* | Masking applies rectangular regions; unmasked UI remains visible. |
| **Centralized VLM Integration** | Task 6, 7 | Server provider abstraction (`MockVlmProvider`, OpenAI, Anthropic, Gemini) | Node.js backend server (`server/`) | System Integration | *"Modular server backend integrates with central VLM providers."* | Remote VLM latency depends on external provider API. |
| **Actionable Browser Commands** | Task 7, 8 | Structured action schemas (`click`, `type`, `scroll`, `navigate`) | Closed-loop execution engine | Architectural & Functional | *"Agent translates VLM visual decisions into DOM actions."* | Actions depend on target element visibility. |
| **Closed-Loop Execution** | Task 7, 8, 17 | Action execution engine, state loop, task completion detector | 8 synthetic task trajectories | Empirical Benchmark | *"Executes closed-loop browser automation tasks autonomously."* | Complex multi-tab workflows require sequential turns. |
| **Client-Side Processing** | Task 2, 4, 16 | 1.56 ms - 2.14 ms median local preprocessing latency | 38 total screenshots (Internal + GUIGuard) | Empirical Benchmark | *"Visual preprocessing completes locally in under 3 ms median latency."* | Measured on benchmark machine CPU. |
| **Internal PII Detection (Task 12 & 17)** | Task 12, 17 | **100.0% Precision, 100.0% Recall** | 13 internal browser scenarios | Synthetic / Local Benchmark | *"On our tested browser scenarios, PII detection achieved 100% precision and recall."* | Evaluated on local browser test fixtures. |
| **GUIGuard Benchmark Performance** | Task 19A, 20, 22 | **75.86% Precision, 42.31% Recall**, 100.0% IoU, 76.72% Redaction | 25 genuine GUIGuard PC screenshots (`PC/136`), 104 GT instances | External Benchmark | *"Evaluated on the official GUIGuard-Bench PC/136 trajectory (25 screenshots, 104 GT instances), achieving 75.9% precision and 42.3% recall."* | Evaluated on 1 PC desktop trajectory (`PC/136`), not full benchmark suite. |
| **GUIGuard Failure Breakdown** | Task 20, 22 | 45.0% OS panel clock (27), 51.7% unlabeled spreadsheet cells (31), 3.3% header text (2) | 60 missed GT occurrences in `PC/136` | Scientific Failure Audit | *"Failure analysis proved missed GUIGuard regions stem from desktop OS window chrome and unlabeled spreadsheet numbers, with no confirmed SIH-relevant browser defect identified."* | Raw spreadsheet numbers lack DOM field metadata on raw screenshots. |

---

## 2. Problem Statement (PS) Requirement Matrix

| PS Requirement | Architectural Implementation | Empirical Evidence | Validation Status | Safe Evaluator Wording |
| :--- | :--- | :--- | :---: | :--- |
| **1. Chrome Extension** | Manifest V3 (`public/manifest.json`), service worker background script | Task 1, 14 audit | **VALIDATED** | *"Implemented and validated as a Chrome Manifest V3 extension."* |
| **2. Firefox Compatibility** | Manifest V2 build target (`public/manifest.firefox.json`), cross-browser WebExtension APIs | Task 15, `npm run build:firefox` | **VALIDATED (Build/Package)** | *"Firefox-compatible build/package validated; Firefox runtime execution was not available in the current environment."* |
| **3. Local Visual Perception** | Local DETR vision model + Tesseract WASM OCR engine running in local Web Workers | Task 2, 4, 16 latency benchmarks | **VALIDATED** | *"Visual perception and OCR run 100% on-device before any network request."* |
| **4. Privacy-Preserving Filtering** | DOM PII detection + OCR regex + multimodal Privacy Intelligence Fusion | Task 4, 5, 12, 17 benchmarks | **VALIDATED** | *"On-device privacy intelligence filters sensitive fields prior to agent planning."* |
| **5. Sanitization Before Transmission** | Canvas redactor masking sensitive bounding boxes with solid rectangles | Task 5, 10, 11 interception tests | **VALIDATED** | *"Raw screenshots and unmasked PII are sanitized on-device before transmission."* |
| **6. Centralized VLM Integration** | Server VLM provider interface supporting Mock, OpenAI, Anthropic, Gemini | Task 6, 7 integration tests | **VALIDATED** | *"Integrates seamlessly with central server-side VLM providers."* |
| **7. Actionable Browser Commands** | Action parser mapping VLM JSON decisions into DOM click/type/scroll actions | Task 7, 8 closed-loop tests | **VALIDATED** | *"Translates VLM visual intent into exact DOM interaction commands."* |
| **8. Closed-Loop Execution** | Iterative capture-redact-send-execute agent state machine | Task 7, 8, 17 multi-step tests | **VALIDATED** | *"Operates closed-loop browser navigation tasks autonomously."* |
| **9. Client-Side Processing** | Local visual perception & redaction pipeline running inside browser extension RAM | Task 2, 4, 16 performance audit | **VALIDATED** | *"All privacy preprocessing completes locally on the client."* |
| **10. Multi-Browser Support** | Cross-browser WebExtension API abstraction (`chrome.*` / `browser.*` wrappers) | Task 14, 15 packaging build | **VALIDATED (Package)** | *"Cross-browser extension architecture supporting Chrome and Firefox builds."* |

---

## 3. Privacy & Security Invariant Claims

### Architectural Guarantees vs Empirical Test Results

| Privacy Component | Category | Guarantee / Result | Verification Method |
| :--- | :--- | :--- | :--- |
| **Raw Screenshot Exfiltration** | **Architectural Guarantee** | Unredacted canvas bitmaps never enter network fetch calls | Code audit & API client design (`src/network/api-client.ts`) |
| **Raw Screenshot Leakage** | **Empirical Test Result** | **0 Bytes exfiltrated** across all normal, multi-step, and error paths | Task 11 network proxy interception (14/14 tests PASS) |
| **Raw PII Text Leakage** | **Empirical Test Result** | **0 Tokens of unmasked PII** transmitted to VLM server | Task 10, 11 payload inspection tests |
| **Raw Vision & OCR Metadata** | **Architectural Guarantee** | Raw OCR text & bounding boxes remain in local browser RAM | Task 4 spatial fusion engine audit |
| **Privacy Budget Enforcement** | **Architectural Guarantee** | Client-side task-scoped heuristic risk budget limits cumulative exposure | Task 5 privacy budget state machine audit |
| **Error-Path Privacy Protection** | **Empirical Test Result** | Network/VLM errors fail-safe without leaking unmasked frames | Task 11 error-injection suite (PASS) |

---

## 4. Benchmark Performance Summary

### Compact Benchmark Performance Matrix (DO NOT AVERAGE)

| Evaluation Source | Data Type | Sample Count | GT Instances | PII Precision | PII Recall | Redaction Coverage | Task Control Preservation | Median Latency | Notes / Environment |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| **Task 12** | Internal Real-World Web | 5 | 18 | **100.0%** | **100.0%** | **100.0%** | N/A | **2.14 ms** | Synthetic/local browser DOM + Visual |
| **Task 17** | Internal Varied Layouts | 8 | 32 | **100.0%** | **100.0%** | **100.0%** | **100.0%** | **2.05 ms** | Synthetic/local robust layout scenarios |
| **GUIGuard Example** | Official HF Example | 26 | 72 | **100.0%** | **100.0%** | **100.0%** | **100.0%** | **1.82 ms** | Official Hugging Face example dataset |
| **GUIGuard PC Subset** | Official HF Benchmark | 25 | 104 | **75.9%** | **42.3%** | **76.7%** | **97.4%** | **1.56 ms** | Official Hugging Face `PC/136` trajectory |

> [!IMPORTANT]
> **Benchmarking Claim Rule**: Never average internal synthetic results with external GUIGuard results into a single artificial "overall score". Each benchmark source must be presented as a separate row.

---

## 5. GUIGuard Failure Disclosure & Tradeoff Evidence

### Reconciled Failure Breakdown on GUIGuard `PC/136`
- **Total Missed Occurrences**: **60** ($104 - 44 = 60$)
- **GNOME Desktop OS Top Panel Clock (45.0% of misses)**: 27 occurrences (`Nov 6 08:07`). Outside browser DOM viewport.
- **Unlabeled Spreadsheet Numeric Cells (51.7% of misses)**: 31 occurrences (`94`, `97.9`) in desktop LibreOffice Calc cells without DOM field metadata.
- **Table Header Text (3.3% of misses)**: 2 occurrences (`Date Height(cm)`).

### Controlled Ablation Study: Usability vs Recall Tradeoff

| Configuration | Precision | Recall | Localization IoU | False Positives | Task Control Preservation | Latency | Decision / Status |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| **Baseline (`baseline`)** | **75.86%** | **42.31%** | **100.00%** | **14** | **97.40%** | **1.56 ms** | **BASELINE (SELECTED)** |
| **Strict High-Risk PII (`pii_strict_high_risk`)** | 100.00% | 19.23% | 100.00% | 0 | 100.00% | 0.04 ms | Rejected (Too narrow) |
| **Aggressive Numeric (`aggressive_numeric`)** | 50.26% | 93.27% | 100.00% | 96 | 82.16% | 0.16 ms | Rejected (Huge FPs, covers controls) |
| **Desktop Clock Inclusion (`include_desktop_clock`)** | 100.00% | 42.31% | 100.00% | 0 | 100.00% | 0.05 ms | Evaluated |

> [!NOTE]
> **Tradeoff Evidence**: Attempting to force-match unlabeled spreadsheet numbers (`aggressive_numeric`) increases recall to 93.27%, but introduces **96 false positives**, drops precision to **50.26%**, and masks **17.84% of task-critical UI controls**. The baseline configuration intentionally preserves task usability.

---

## 6. Privacy Budget Scope Definition

> [!WARNING]
> **Privacy Budget Qualification**:
> The client-side privacy budget is a **task-scoped heuristic risk accounting mechanism** (`PrivacyBudgetManager`). It tracks cumulative risk cost based on exposed PII categories (e.g. Email = 10, SSN = 25, Password = 40) per session.
>
> **It is NOT**:
> - Formal differential privacy ($\epsilon$-DP).
> - A mathematical differential privacy noise mechanism.
> - A cryptographic privacy proof.

---

## 7. Performance & Latency Breakdown

| Preprocessing Stage | Latency Measurement | Scope / Environment |
| :--- | :---: | :--- |
| **Local Visual Preprocessing (Median)** | **1.56 ms - 2.14 ms** | On-device DETR + Tesseract WASM + Privacy Fusion |
| **Local Visual Preprocessing (P95)** | **6.16 ms** | 95th percentile local preprocessing time |
| **End-to-End Task Iteration (Mock VLM)** | **210 ms - 310 ms** | Local mock server turn response time |
| **Remote Production VLM Latency** | *Dependent on Provider* | OpenAI / Anthropic / Gemini network RTT |

---

## 8. Claims Explicitly Prohibited by Evidence

The following claims are **STRICTLY PROHIBITED** because they are contradicted or unsupported by empirical evidence:

| Prohibited Claim | Why It Is Prohibited | Safe Replacement Claim |
| :--- | :--- | :--- |
| ❌ *"100% real-world PII detection."* | Real-world visual layouts contain ambiguous data; GUIGuard recall was 42.31%. | *"Achieved 100% precision and recall on tested browser scenarios."* |
| ❌ *"100% GUIGuard benchmark performance."* | Evaluated on 1 PC desktop trajectory (`PC/136`), achieving 75.9% precision and 42.3% recall. | *"Evaluated on the official GUIGuard-Bench PC/136 trajectory."* |
| ❌ *"Zero privacy risk / mathematically flawless protection."* | Visual redaction uses rectangular region masks; complex canvas layouts have residual risk. | *"Redacts detected sensitive regions on-device prior to network transmission."* |
| ❌ *"Formally differentially private."* | Privacy budget is a heuristic risk counter, not $\epsilon$-differential privacy. | *"Uses a task-scoped heuristic privacy budget manager."* |
| ❌ *"Firefox runtime execution fully validated."* | Live Firefox browser execution was not tested in context. | *"Firefox-compatible build and packaging validated."* |
| ❌ *"Zero performance overhead."* | Preprocessing requires 1.56 - 2.14 ms local CPU execution. | *"Adds negligible local preprocessing latency under 3 ms."* |
| ❌ *"Production-ready commercial product."* | Implemented as a research prototype for SIH 2026 problem statement. | *"Functional SIH 2026 browser extension prototype."* |

---

## 9. Evaluator-Safe Short Statements

The following concise statements are pre-approved for use during SIH presentations, README documentation, and evaluator Q&A:

1. *"Our privacy-sensitive visual processing happens 100% locally on-device before any network transmission."*
2. *"Our browser pipeline combines HTML DOM inspection, Tesseract WASM OCR, and local visual perception."*
3. *"Every agent turn passes through the privacy redaction layer before context is transmitted to the VLM server."*
4. *"Our privacy budget is a task-scoped heuristic risk counter, not formal differential privacy."*
5. *"On our tested browser fixtures with DOM access, PII detection achieved 100% precision and recall."*
6. *"On the evaluated GUIGuard-Bench PC/136 trajectory (25 screenshots, 104 GT instances), the visual-only pipeline achieved 75.9% precision, 42.3% recall, and 100% localization IoU."*
7. *"Failure analysis proved that 45.0% of missed GUIGuard regions were OS top panel clocks and 51.7% were unlabeled spreadsheet cell numbers, with no confirmed SIH-relevant browser defect identified."*
8. *"Ablation testing showed that aggressive numeric detection increased recall but caused 96 false positives and masked 17.8% of UI controls, so we retained our balanced baseline."*
9. *"Firefox build packaging was validated, while Firefox live browser execution was not available in our testing environment."*
10. *"Adversarial network testing verified that 0 raw screenshot bytes and 0 unmasked PII tokens leave the client."*
