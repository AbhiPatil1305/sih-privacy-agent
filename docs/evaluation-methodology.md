# SIH 2026 Evaluation Methodology & Performance Specification

---

## 1. Executive Summary

This document defines the evaluation methodology, metric definitions, mathematical formulas, and scientific claim discipline for benchmarking the **SIH 2026 Privacy-Preserving Browser Agent**.

Evaluation is performed under rigorous, reproducible conditions using synthetic test fixtures, deterministic ground-truth annotations, and microsecond-accurate latency profiling.

---

## 2. Evaluation Metrics & Mathematical Formulas

### A. PII Detection Precision
$$\text{Precision} = \frac{\text{True Positives (TP)}}{\text{True Positives (TP)} + \text{False Positives (FP)}}$$
- **TP**: Detected region matching a ground-truth sensitive region with $\text{IoU} \ge 0.5$ and matching category.
- **FP**: Detected region with no matching ground-truth region.

### B. PII Detection Recall
$$\text{Recall} = \frac{\text{True Positives (TP)}}{\text{True Positives (TP)} + \text{False Negatives (FN)}}$$
- **FN**: Ground-truth sensitive region missed by the detection pipeline.

### C. Redaction Coverage (Recall of Sensitive Pixels)
$$\text{Coverage}(G) = \frac{\text{Area}(\text{Redacted Overlay} \cap G)}{\text{Area}(G)}$$
- Measures the percentage of pixels inside ground-truth region $G$ protected by `BLACK` or `BLUR` overlays.
- **Mean Coverage**: Average coverage across all ground-truth sensitive regions.

### D. Visual Context Preservation Rate (1.0 - False Redaction Rate)
$$\text{False Redaction Rate} = \frac{\text{Area}(\text{Redacted Overlay} \setminus \text{Ground Truth Union})}{\text{Area}(\text{Viewport}) - \text{Area}(\text{Ground Truth Union})}$$
$$\text{Context Preservation Rate} = 1.0 - \text{False Redaction Rate}$$
- Quantifies how much non-sensitive visual structure is preserved for VLM reasoning.

### E. Latency Metrics ($N=10$ Trials)
Microsecond-accurate latency profiling (`performance.now()`) across 12 distinct pipeline stages:
1. Tab Canvas Capture
2. DOM Extraction
3. DOM Sanitization
4. Vision Model Initialization (Cold-Start)
5. Vision Steady-State Inference (Warm)
6. OCR Initialization (Cold-Start)
7. OCR Steady-State Inference (Warm)
8. Privacy Intelligence Fusion
9. Privacy Risk Cost Calculation
10. Adaptive Redaction Policy Execution
11. Offscreen Canvas Redaction
12. Sanitized Payload Construction & Dispatch

Reported values: **Median (P50)**, **P95**, **Minimum**, **Maximum**.

---

## 3. Evaluation Test Scenarios (A through G)

| Scenario ID | Name / Description | Target Content | Expected Ground Truth |
|-------------|----------------────|----------------|-----------------------|
| **Scenario A** | Normal Webpage (Zero PII) | Search bar, nav links, doc buttons | Zero PII regions |
| **Scenario B** | DOM-Visible PII | Name, email input, tel input | 2 PII regions (EMAIL, PHONE) |
| **Scenario C** | Visual-Only PII (Canvas/OCR) | Canvas image with synthetic email & phone text | 2 PII regions (EMAIL, PHONE) |
| **Scenario D** | Mixed DOM + Visual PII | Input form + visual banner containing email & face | 3 PII regions (EMAIL, PHONE, FACE) |
| **Scenario E** | Sensitive High-Risk PII | Password input, synthetic credit card, SSN | 3 PII regions (PASSWORD, CREDIT_CARD, SSN) |
| **Scenario F** | Visual Non-PII Layout Preservation | Form buttons, charts, navigation headers | Zero PII (100% Visual Context Preserved) |
| **Scenario G** | Multi-Step Browser Flow | Search $\rightarrow$ Select $\rightarrow$ Confirm flow | Multi-step agent execution reliability |

---

## 4. Scientific Claim Discipline Guidelines

To maintain scientific integrity and submission rigor, all project evaluations MUST adhere to explicit claim boundaries:

| Prohibited Unsubstantiated Claim | Permitted Scientific Language |
|-----------------------------------|-------------------------------|
| ❌ "100% secure privacy system" | ✅ "No tested PII leakage observed under the defined 14-test adversarial suite." |
| ❌ "Zero latency on-device pipeline" | ✅ "Measured median local pipeline latency of 0.018ms on test environment." |
| ❌ "Production-ready zero memory footprint" | ✅ "Application-level heap usage measured at 4.21 MB; native browser model memory marked as unavailable in Node CLI environment." |
| ❌ "Real-world VLM 100% completion rate" | ✅ "Deterministic mock-VLM completion rate measured at 66.7% across multi-step benchmark scenarios." |

---

## 5. Execution Instructions

To execute the full Task 12 evaluation harness:

```bash
node benchmark/run-task12-eval.cjs
```

Results are saved to `benchmark/results/task12-evaluation.json` and `benchmark/results/task12-evaluation.md`.
