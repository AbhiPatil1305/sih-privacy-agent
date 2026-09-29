# GUIGuard External Dataset Access & Feasibility Report

This document records the exact accessibility status of the **GUIGuard-Bench** dataset (*arXiv:2601.18842*) within the local development environment.

---

## 1. Local Environment Access Status

- **Status**: **NOT PRE-BUNDLED IN LOCAL WORKSPACE**
- **Dataset Scale**: 630 trajectories, 13,830 screenshots across Android and PC environments.
- **Download Requirement**: Full raw image binaries and trajectory logs reside on external academic repositories requiring multi-gigabyte remote data transfers.
- **Offline / Isolated Execution Rule**: To comply with isolated execution constraints and prevent downloading large external image archives, the local environment evaluates GUIGuard compatibility using a **deterministic local schema adapter** ([`benchmark/guiguard/run-guiguard-adapter.cjs`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/benchmark/guiguard/run-guiguard-adapter.cjs)).

---

## 2. Accessible vs Non-Accessible Resources

| Resource | Access Status | Handling in Local Harness |
| :--- | :---: | :--- |
| **GUIGuard Paper & Specifications** | **ACCESSIBLE** | Studied from published literature (`arXiv:2601.18842`). |
| **GUIGuard Annotation Schema Format** | **ACCESSIBLE** | Replicated deterministically in local JSON fixtures. |
| **PC Web GUI Trajectory Schemas** | **ACCESSIBLE** | Evaluated via local Web extension test adapter. |
| **Full 13,830 Raw Screenshot Bitmaps** | **NOT ACCESSIBLE LOCALLY** | Evaluated via deterministic local benchmark subset. |
| **Android APK / Mobile Environment** | **NOT APPLICABLE** | Excluded (SIH Problem Statement targets Chrome/Firefox extensions). |

---

## 3. Claim Discipline Commitment

- **No Fabricated Data**: We do not claim to have executed all 13,830 raw external screenshots.
- **Deterministic Local Evaluation**: Evaluation is conducted on a deterministic GUIGuard-compliant benchmark sample set constructed in local JSON fixtures.
- **Explicit Boundary**: Internal synthetic benchmarks and external GUIGuard results are kept 100% separate and never averaged into an artificial "overall score".
