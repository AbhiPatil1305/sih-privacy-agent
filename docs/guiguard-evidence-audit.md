# GUIGuard Evidence Audit & Metric Provenance Report

This document presents a strict evidence audit of all input data, sample provenance, evaluation formulas, and claims associated with the Task 18 GUIGuard evaluation adapter ([`benchmark/guiguard/run-guiguard-adapter.cjs`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/benchmark/guiguard/run-guiguard-adapter.cjs)).

---

## 1. Input Data & Sample Provenance Analysis

Every sample evaluated in Task 18 was traced to its exact source location:

| Sample ID | Data Source Classification | Filename / Origin | Actual Images Evaluated? | Provenance / Verification Status |
| :--- | :--- | :--- | :---: | :--- |
| `guiguard_web_001_form` | **D. Manually constructed schema-compatible sample** | `benchmark/guiguard/run-guiguard-adapter.cjs` (Lines 11–28) | No | Locally authored JSON object adhering to GUIGuard annotation schema. |
| `guiguard_web_002_profile_canvas` | **D. Manually constructed schema-compatible sample** | `benchmark/guiguard/run-guiguard-adapter.cjs` (Lines 29–48) | No | Locally authored JSON object adhering to GUIGuard annotation schema. |
| `guiguard_web_003_dashboard_ssn` | **D. Manually constructed schema-compatible sample** | `benchmark/guiguard/run-guiguard-adapter.cjs` (Lines 49–65) | No | Locally authored JSON object adhering to GUIGuard annotation schema. |

> **Audit Finding**: Zero official GUIGuard raw screenshot images (`.png`/`.jpg`) were downloaded or evaluated in Task 18. All metrics were computed locally on schema-compatible JSON bounding box records.

---

## 2. Metric Provenance & Verification Matrix

| Metric | Input Source | Ground Truth | Evaluated Samples | Official GUIGuard Definition? | Genuine External Benchmark Performance? |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Privacy Precision** | Schema-compatible local JSON | Bounding box category annotations | 3 local schema scenarios | Partial (Standard Precision formula) | **No** (Schema compatibility metric only) |
| **Privacy Recall** | Schema-compatible local JSON | Bounding box category annotations | 3 local schema scenarios | Partial (Standard Recall formula) | **No** (Schema compatibility metric only) |
| **Localization IoU** | Spatial bounding boxes | Bounding box coordinates ($\text{IoU} \ge 0.5$) | 5 Ground Truth regions | Yes ($\text{IoU} \ge 0.5$) | **No** (Schema compatibility metric only) |
| **Redaction Protection** | Local Privacy Engine | High-risk PII black overlay rule | 5 Ground Truth regions | Partial | **No** (Schema compatibility metric only) |
| **Task Control Preservation** | Interactive button bboxes | `task_relevant_controls` array | 3 task control targets | Partial | **No** (Schema compatibility metric only) |
| **Network Privacy Boundary** | Mock HTTP request payload | Synthetic string search | 3 scenario payloads | Project Invariant | **No** (Internal privacy invariant check) |

---

## 3. Corrected Claim & Terminology Policy

To ensure 100% scientific claim discipline for all SIH 2026 presentations, documentation, and final submissions:

| Overstated / Invalid Claim | Corrected Scientific Claim | Rationale |
| :--- | :--- | :--- |
| ❌ *"GUIGuard External Benchmark: 100%"* | ✅ *"GUIGuard schema compatibility evaluation: 100% on locally evaluated compatibility fixtures."* | Official GUIGuard screenshot dataset was not processed locally. |
| ❌ *"Our system achieves 100% on GUIGuard."* | ✅ *"Our local privacy adapter successfully parses GUIGuard annotation schemas and enforces 100% privacy boundary protection."* | Performance was measured on local schema-compatible test cases. |
| ❌ *"GUIGuard benchmark performance is verified."* | ✅ *"The official GUIGuard benchmark performance was not independently reproduced because the required official screenshot dataset was not fully available in the local evaluation environment."* | Preserves complete truthfulness regarding external dataset access. |
