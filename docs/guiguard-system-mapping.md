# GUIGuard System Mapping & Architectural Comparison

This document maps the concepts, pipeline stages, privacy tasks, and metrics defined in **GUIGuard** (*arXiv:2601.18842*) to the current architecture of the **SIH 2026 Privacy-Preserving Browser Agent**.

> **Audit Correction Note (Task 19)**:
> Mappings have been audited against strict comparability standards. A dimension is classified as `PARTIALLY COMPARABLE` when concepts overlap but input populations, ground-truth semantics, or platform environments differ.

---

## 1. Architectural Concept Mapping Matrix

| GUIGuard Benchmark Concept | Our System Architecture Component | Mapping Classification | Rationale & Technical Analysis |
| :--- | :--- | :---: | :--- |
| **Privacy Recognition** | Multi-modal Privacy Intelligence (`DOM Regex` + `ONNX DETR Vision` + `Tesseract WASM OCR` + `Privacy Fusion`) | **PARTIALLY COMPARABLE** | Both identify sensitive PII in GUI screenshots, but GUIGuard evaluates crowdsourced mobile/desktop app screenshots while our system evaluates web extension DOM/Vision contexts. |
| **Privacy Localization** | `PrivacyRegion` Bounding Boxes (`{x, y, width, height}`) & $\text{IoU} \ge 0.5$ Evaluation | **PARTIALLY COMPARABLE** | Both ground sensitive regions using spatial bounding boxes ($\text{IoU} \ge 0.5$), but ground-truth annotation sources differ. |
| **Privacy Protection** | Adaptive Redaction Policy (`src/privacy/redactor.ts` & `src/privacy/redaction-policy.ts`) | **PARTIALLY COMPARABLE** | Both apply visual redaction/masking, but GUIGuard evaluates model-driven masks whereas our system enforces deterministic black/blur policy invariants. |
| **Privacy / Task Necessity** | Task-Relevant UI Preservation & Privacy Budget Reasoning (`src/privacy/privacy-budget.ts`) | **PARTIALLY COMPARABLE** | Both evaluate preserving task-relevant controls, but GUIGuard annotates mobile touch targets while our system evaluates web DOM/CSS action targets. |
| **Protected Task Execution** | Closed-Loop Agent State Machine (`src/background/agent-loop.ts`) under Sanitized VLM Payload | **PARTIALLY COMPARABLE** | Both involve closed-loop action planning on sanitized UI context, but GUIGuard evaluates Android touch actions alongside PC Web actions. |
| **Android Mobile GUI Domain** | N/A (Web Extension / Browser Architecture) | **NOT COMPARABLE** | Our project target is strictly a Chrome / Firefox web extension as mandated by the SIH 2026 Problem Statement. Mobile Android APK evaluation is outside SIH PS scope. |

---

## 2. Detailed Stage-by-Stage Mapping Analysis

### A. Privacy Recognition & Detection
- **GUIGuard**: Detects sensitive UI regions in mobile/desktop screenshots.
- **Our Implementation**: `runPrivacyIntelligence` inspects DOM element types/labels, OCR text segments, and DETR vision detections.
- **Classification**: `PARTIALLY COMPARABLE`. Conceptual overlap in PII category recognition, but input populations differ.

### B. Privacy Localization
- **GUIGuard**: Evaluates bounding box grounding against crowdsourced annotations using $\text{IoU} \ge 0.5$.
- **Our Implementation**: Computes IoU overlap between detected `PrivacyRegion` bounding boxes and ground-truth regions.
- **Classification**: `PARTIALLY COMPARABLE`. Identical spatial math, but evaluation datasets differ.

### C. Privacy Protection & Sanitization
- **GUIGuard**: Applies visual masking to sensitive bounding boxes.
- **Our Implementation**: `redactScreenshot` uses `OffscreenCanvas` to draw solid black boxes over high-risk PII and 16px Gaussian blur over faces/avatars.
- **Classification**: `PARTIALLY COMPARABLE`. Complete pre-transmission sanitization, but protection policy models differ.

### D. Task-Relevant Control Preservation
- **GUIGuard**: Evaluates whether masking privacy regions accidentally obscures mobile/desktop controls required for task execution.
- **Our Implementation**: Measures Task-Relevant UI Preservation Rate by testing whether required action targets remain unmasked.
- **Classification**: `PARTIALLY COMPARABLE`.

---

## 3. Metric Compatibility Summary

| GUIGuard Metric | Comparable in Our System? | Our Implementation Metric | Equivalence Classification |
| :--- | :---: | :--- | :---: |
| **Privacy Precision** | Partial | `piiDetectionPerformance.overallPrecision` | **Partially Comparable** |
| **Privacy Recall** | Partial | `piiDetectionPerformance.overallRecall` | **Partially Comparable** |
| **Localization IoU** | Partial | Bounding Box IoU ($\ge 0.5$) | **Partially Comparable** |
| **Redaction Coverage** | Partial | `redactionQuality.meanCoverage` | **Partially Comparable** |
| **Task Control Preservation** | Partial | `visualContextPreservation.taskRelevantPreservationRate` | **Partially Comparable** |
| **Android Mobile Accuracy** | No | N/A (Browser Web Extension only) | **Not Comparable** |
