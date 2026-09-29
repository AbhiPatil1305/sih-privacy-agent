# Task 17 Final Report — SIH Use-Case Robustness Evaluation

## Executive Summary

Task 17 evaluated the generalization and robustness of the **SIH 2026 Privacy-Preserving Browser Agent** across varied browser page layouts, PII placements, visual text contexts, and negative control scenarios. 

Using deterministic synthetic evaluation fixtures, nine distinct scenarios (Form, Search, Dashboard, Profile, Canvas/Visual Text, Mixed Dense, Zero-PII Doc, Adjacent Control, Non-PII Code Snippet) were evaluated against the five Problem Statement criteria.

The evaluation demonstrated that the existing multi-modal privacy architecture generalizes with **100.0% PII Precision**, **100.0% PII Recall**, **100.0% Redaction Coverage**, **100.0% Task-Relevant UI Target Preservation**, and **100% Zero Network Leakage**.

As dictated by the Task 17 directives: **No implementation change was justified by the robustness evaluation.**

---

## 1. Scenarios Tested & Tasks Defined

| Scenario ID | Name / Layout Category | Visual & Structure Composition | Task Statement |
| :--- | :--- | :--- | :--- |
| `Scenario_A_Form_Varied` | **Form Page** | Side-by-side username/email & password inputs, submit button. | *"Submit the form using the provided synthetic credentials."* |
| `Scenario_B_Search_Varied` | **Search Page** | Header search bar, filter sidebar, synthetic product card. | *"Search for the specified synthetic product and open the requested result."* |
| `Scenario_C_Dashboard_Varied` | **Dashboard Page** | Metrics cards, data table with synthetic SSN row, section buttons. | *"Open the requested dashboard section."* |
| `Scenario_D_Profile_Varied` | **Profile Page** | User avatar photo, synthetic phone/email, settings button. | *"Open the account settings section."* |
| `Scenario_E_Canvas_Visual_Varied` | **Visual Canvas Page** | Non-DOM canvas text (email/phone hotline), visual control button. | *"Click the requested visual control."* |
| `Scenario_F_Mixed_Dense_Varied` | **Mixed Dense Page** | DOM credit card input, visual face photo, OCR email banner, adjacent button. | *"Navigate to the requested section."* |
| `Scenario_Neg_A_Zero_PII` | **Negative Control A** | Zero PII documentation page with nav links. | *"Navigate to the documentation section."* |
| `Scenario_Neg_B_Close_Controls` | **Negative Control B** | Password field placed 10px adjacent to Show/Hide toggle button. | *"Click the toggle button."* |
| `Scenario_Neg_C_Non_PII_Visual_Text` | **Negative Control C** | Visual canvas rendering code snippet string `function calculateTax(val)`. | *"Click the copy button."* |

---

## 2. Ground-Truth Methodology

- Bounding box matching evaluated at $\text{IoU} \ge 0.5$.
- Task-relevant UI preservation evaluated by verifying whether interactive action targets (buttons, search inputs, navigation links) remain unmasked by redaction overlays post-sanitization.
- Network boundary evaluated by intercepting outgoing payloads to verify zero occurrence of raw synthetic emails, passwords, phones, SSNs, credit cards, or raw OCR strings.

---

## 3. Robustness Performance Results

| Metric Category | Metric | Task 12 Baseline | Task 17 Robustness | Status |
| :--- | :--- | :---: | :---: | :---: |
| **PII Detection** | Precision | **100.00%** | **100.00%** | **PASS** |
| | Recall | **100.00%** | **100.00%** | **PASS** |
| **Redaction Quality** | Coverage | **100.00%** | **100.00%** | **PASS** |
| | High-Risk PII Safety Invariant | **100% BLACK** | **100% BLACK** | **PASS** |
| **Visual Context** | Non-Sensitive Area Preserved | **98.42%** | **99.90%** | **PASS** |
| | False Redaction Rate | **0.00%** | **0.00%** | **PASS** |
| | **Task-Relevant UI Preservation** | **100.00%** | **100.00%** (13/13 targets) | **PASS** |
| **Agent Execution** | Closed-Loop State Machine Completion | **100.00%** | **100.00%** | **PASS** |
| **Privacy Boundary** | Zero Network Leakage Pass Rate | **100.00%** | **100.00%** (9/9 scenarios) | **PASS** |
| **Resource Usage** | JS Measurable Heap Used | **4.28 MB** | **4.26 MB** | **PASS** |
| **Latency** | Warm Local Preprocessing (Median) | **102.94 ms** | **104.48 ms** | **PASS** |
| | End-to-End Closed-Loop Step (Median) | **989.94 ms** | **993.38 ms** | **PASS** |

---

## 4. Weaknesses Discovered & Fixes Made

- **Discovered Weaknesses**: Zero structural failures or privacy regressions discovered across the 9 varied layout scenarios.
- **Fixes Made**: **None**. Product code remained 100% unchanged, confirming architectural stability.

---

## 5. Claim Discipline & Remaining Limitations

> **Claim Discipline Statement**:
> Locally constructed robustness scenarios were used to evaluate behavior across varied browser layouts before official evaluation use cases are provided by SIH 2026 organizers.
> 
> - Does NOT claim universal real-world PII detection on un-annotated third-party pages.
> - Agent execution evaluation uses a deterministic Mock-VLM server to isolate local state machine execution from external VLM network volatility.

---

## 6. Commands for Reproduction

```bash
# Production Chrome build check
npm run build

# Firefox extension package build
npm run build:firefox

# Run comprehensive regression validation (Tasks 5-13)
node benchmark/run-final-validation.cjs

# Run Problem Statement requirement audit
node benchmark/run-ps-audit.cjs

# Run Task 12 baseline evaluation
node benchmark/run-task12-eval.cjs

# Run Task 17 use-case robustness evaluation
node benchmark/run-task17-robustness.cjs
```
