# SIH 2026 Privacy Agent — Task 12 Evaluation Report

**Execution Timestamp**: `2026-09-29T13:52:54.439Z`  
**Environment**: Node.js `v20.20.1` (`win32`)  
**VLM Provider Mode**: `Mock-VLM (Deterministic Benchmark Server)`  
**Trials per Metric**: `10`

---

## 1. Executive Summary

This report delivers the scientific performance, privacy, and accuracy evaluation for the **SIH 2026 Privacy-Preserving Browser Agent**. Metrics were collected using synthetic test fixtures, microsecond-accurate latency profiling, and ground-truth bounding box annotations.

---

## 2. Evaluation Scenarios

| Scenario | Description | Ground Truth Regions |
|----------|-------------|----------------------|
| **Scenario A** | Normal Webpage (Zero PII) | 0 |
| **Scenario B** | DOM-Visible PII | 2 |
| **Scenario C** | Visual-Only PII (Canvas/OCR) | 2 |
| **Scenario D** | Mixed DOM + Visual PII | 3 |
| **Scenario E** | Sensitive High-Risk PII | 3 |
| **Scenario F** | Visual Non-PII Context Preservation | 0 |
| **Scenario G** | Multi-Step Browser Flow | Multi-step |

---

## 3. PII Detection Precision & Recall

- **Overall Precision**: **100.0%**
- **Overall Recall**: **100.0%**
- **True Positives**: `10` | **False Positives**: `0` | **False Negatives**: `0`
- **Matching Rule**: Bounding box $\text{IoU} \ge 0.5$ with category match

---

## 4. Redaction Quality & Visual Context Preservation

| Metric | Score | Explanation |
|--------|-------|-------------|
| **Mean Redaction Coverage** | **100.0%** | Sensitive GT pixel protection |
| **Minimum Coverage** | **100.0%** | Lowest protected GT region |
| **Regions $\ge 90\%$ Protected** | **100.0%** | Percentage meeting threshold |
| **False Redaction Rate** | **0.00%** | Unnecessary safe pixel redaction |
| **Visual Context Preservation** | **100.00%** | Non-sensitive page area unmasked |

> [!NOTE]
> High-risk PII categories (`EMAIL`, `PHONE`, `PASSWORD`, `CREDIT_CARD`, `SSN`) evaluated to **`BLACK` protection across 100% of trials**.

---

## 5. Microsecond Pipeline Latency Breakdown ($N=10$ Trials)

| Pipeline Stage | Median (ms) | P95 (ms) | Min (ms) | Max (ms) |
|----------------|-------------|----------|----------|----------|
| Screenshot Capture | `13.75` | `14.309` | `12.726` | `14.309` |
| DOM Extraction | `4.727` | `5.083` | `4.311` | `5.083` |
| DOM Sanitization | `0.001` | `0.045` | `0` | `0.045` |
| Vision Infer (Warm) | `45.026` | `46.591` | `42.208` | `46.591` |
| OCR Infer (Warm) | `29.135` | `31.844` | `28.456` | `31.844` |
| Privacy Fusion | `0.005` | `0.047` | `0.001` | `0.047` |
| Privacy Budget Calc | `0.002` | `0.035` | `0.001` | `0.035` |
| Redaction Policy | `0.002` | `0.057` | `0.001` | `0.057` |
| Offscreen Redaction | `9.715` | `10.407` | `9.148` | `10.407` |
| Payload Construction | `0.004` | `0.015` | `0.003` | `0.015` |
| **Total Local Preprocessing** | **`102.243`** | **`105.366`** | **`99.131`** | **`105.366`** |

- **Cold-Start Model Load Time**: Vision ONNX Init = `145ms` | OCR Worker Init = `85ms`

---

## 6. End-to-End Step Latency

- **Local Preprocessing (Median)**: `102.243 ms`
- **Mock VLM Planning**: `105 ms`
- **Action Execution**: `32 ms`
- **Page Settlement**: `750 ms`
- **Total End-to-End Step Latency**: **`989.2 ms`**

---

## 7. Network Payload Compression & Privacy Verification

- **Raw Local Payload Size**: `439.8 KB`
- **Sanitized Network Payload Size**: `312.8 KB`
- **Payload Reduction**: **`28.87%`**
- **Zero PII Network Leakage Verified**: ✅ Yes (Tested across 14 adversarial boundary checks)

---

## 8. Client Resource Measurements

- **Application Measurable Heap Used**: `4.28 MB`
- **Application Heap Total**: `4.73 MB`
- **Native Browser Model Memory Note**: Isolated inside native WebGPU/WASM Chrome tab contexts.

---

## 9. Known Limitations & Claim Discipline

1. **Mock VLM Mode**: End-to-end latency uses a deterministic mock VLM server. Live network latency varies based on remote VLM host location.
2. **Synthetic Fixtures**: Accuracy metrics are evaluated on synthetic PII test fixtures to guarantee zero raw external PII leakage.
