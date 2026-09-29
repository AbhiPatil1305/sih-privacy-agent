# SIH 2026 Privacy Agent — Benchmark Results Report

**Execution Timestamp**: `2026-09-29T13:52:54.168Z`  
**Environment**: Node.js `v20.20.1` (`win32`)  
**Trials per Metric**: `10`

---

## 1. PII Detection Performance

| Metric | Score | Details |
|--------|-------|---------|
| **Precision** | **100.0%** | True Positives / (TP + FP) |
| **Recall** | **100.0%** | True Positives / (TP + FN) |
| True Positives (TP) | `7` | Matching IoU $\ge 0.5$ |
| False Positives (FP) | `0` | Unmatched detections |
| False Negatives (FN) | `0` | Missed ground-truth regions |

---

## 2. Redaction Coverage & Context Preservation

| Metric | Score | Details |
|--------|-------|---------|
| **Mean Redaction Coverage** | **100.0%** | Sensitive GT pixel protection |
| **Minimum Coverage** | **100.0%** | Lowest protected GT region |
| **Regions $\ge 90\%$ Protected** | **100.0%** | Percentage meeting threshold |
| **False Redaction Rate** | **0.00%** | Unnecessary safe pixel redaction |
| **Visual Context Preservation** | **100.00%** | Safe area remaining unmasked |

---

## 3. Local Processing Latency ($N=10$ Trials)

| Pipeline Stage | Mean (ms) | Median (ms) | P95 (ms) | Min (ms) | Max (ms) |
|----------------|-----------|-------------|----------|----------|----------|
| Privacy Fusion | `0.013` | `0.008` | `0.05` | `0.001` | `0.05` |
| Privacy Budget | `0.006` | `0.001` | `0.036` | `0.001` | `0.036` |
| Redaction Policy | `0.017` | `0.007` | `0.074` | `0.002` | `0.074` |
| **Total Local Pipeline** | **`0.036`** | **`0.021`** | **`0.147`** | **`0.004`** | **`0.147`** |

---

## 4. Privacy Budget & Adaptive Redaction Verification

- **Budget Exhaustion Check**:
  - Initial Budget = 100: Network Allowed = `true`, Status = `active`
  - Initial Budget = 20 (Step Cost = 30): Network Allowed = `false`, Status = `privacy_budget_exhausted`
- **High-Risk Safety Invariant**: High-risk PII (`EMAIL`, `PASSWORD`) remained `BLACK` in all budget modes (`NORMAL`, `AGGRESSIVE`, `STRICT`).
- **Visual Adaptive Upgrade**: `FACE` and `AVATAR` rendered `BLUR` in `NORMAL` mode and upgraded to `BLACK` in `AGGRESSIVE`/`STRICT` modes.

---

## 5. Multi-Step Agent Reliability

| Scenario | Task | Executed Steps | Status | Failure Category | Completed |
|----------|------|----------------|--------|------------------|-----------|
| Scenario A | Search product and view item | 2 | `completed` | None | ✅ Yes |
| Scenario B | Login to user account | 3 | `completed` | None | ✅ Yes |
| Scenario C | Multi-page checkout flow | 4 | `completed` | None | ✅ Yes |
| Scenario D | Click removed element | 1 | `failed` | `execution` | ❌ No |
| Scenario E | High-risk form submission | 2 | `privacy_budget_exhausted` | `privacyBudget` | ❌ No |
| Scenario F | Complex pagination search | 10 | `max_steps` | `maxSteps` | ❌ No |

### Failure Categorization Breakdown
- **Planning Failures**: `0`
- **Action Execution Failures**: `1` (Target element removed or script execution failed)
- **State Transition / Settle Failures**: `0`
- **Completion Detection Failures**: `0`
- **Timeout Failures**: `0`
- **Privacy Budget Exhaustion**: `1` (Step cost exceeded remaining budget)
- **Max Steps Exceeded**: `1` (Task required >10 steps)

- **Overall Scenario Completion Rate**: **50.0%** (3 / 6)
- **Average Steps**: `3.67`
