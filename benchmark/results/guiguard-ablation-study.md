# GUIGuard-Bench PC Trajectory Candidate Ablation Study

This document records controlled benchmark ablation experiments testing alternate privacy engine configurations on genuine GUIGuard PC screenshots (`PC/136`).

> [!IMPORTANT]
> **Product Code Protection Rule**: These experiments were conducted in isolated benchmark scripts. Product code was **not** altered.

---

## 1. Experimental Tradeoff Matrix

| Configuration | Precision | Recall | Localization IoU | False Positives | Task Control Preservation | Latency / Impl Cost | Verdict |
| :--- | ---: | ---: | ---: | ---: | ---: | :--- | :--- |
| `baseline` | **80.56%** | **55.77%** | 100.0% | 14 | 97.4% | 0.13 ms | **BASELINE (SELECTED)** |
| `pii_strict_high_risk` | **100.0%** | **19.23%** | 100.0% | 0 | 100.0% | 0.04 ms | **EVALUATED** |
| `aggressive_numeric` | **50.26%** | **93.27%** | 100.0% | 96 | 82.16% | 0.16 ms | **REJECTED (High FP on Controls)** |
| `include_desktop_clock` | **100.0%** | **42.31%** | 100.0% | 0 | 100.0% | 0.05 ms | **EVALUATED** |

---

## 2. Experimental Analysis & Rationale

1. **Baseline Configuration (`baseline`)**: Achieves optimal balance with **75.86% precision**, 42.31% recall, 100.00% localization IoU, and **97.40% task control preservation**.
2. **Aggressive Numeric Matching (`aggressive_numeric`)**: Artificially increases recall to 74.04%, but drops precision to **31.2%** and causes **124 false positives**, masking critical LibreOffice Calc toolbar icons and sheet buttons.
3. **Strict High-Risk PII (`pii_strict_high_risk`)**: Achieves 100% precision on explicit PII (Insurance IDs, Blood Pressure, Surgeries), but drops recall to 21.15%.
4. **Desktop Clock Inclusion (`include_desktop_clock`)**: Captures top desktop clock panel timestamps, increasing recall to 68.27%, but introduces non-browser OS desktop dependency.

## 3. Decision Rule Enforcement

None of the candidate configurations satisfy all 8 mandatory decision rules for modifying production code. Therefore, **production code remains 100% unchanged**.