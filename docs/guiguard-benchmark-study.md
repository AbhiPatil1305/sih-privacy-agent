# GUIGuard External Benchmark Feasibility & Evaluation Study

This document presents a comprehensive study of **GUIGuard** (*"GUIGuard: Toward a General Framework for Privacy-Preserving GUI Agents"*, arXiv:2601.18842, Jan 2026), an external academic benchmark designed for privacy-preserving GUI agent evaluation.

---

## 1. GUIGuard Benchmark Overview

GUIGuard formulates privacy-preserving GUI automation into a three-stage lifecycle:
1. **Privacy Recognition**: Detecting sensitive UI elements within GUI screenshots.
2. **Privacy Protection**: Sanitizing/redacting sensitive regions before data leaves the local device.
3. **Task Execution Under Protection**: Executing closed-loop GUI action trajectories using sanitized GUI context without degrading task success.

### Benchmark Scope & Composition
- **Total Trajectories**: 630 task trajectories.
- **Total Screenshots**: 13,830 annotated screenshots.
- **Target Environments**: Android OS mobile interfaces and PC / Desktop Web interfaces.
- **Annotation Granularity**: Region-level bounding box coordinates, fine-grained PII risk categories, risk levels (High / Moderate / Low), and task-necessity flags for interactive UI controls.

---

## 2. Benchmark Tasks & Evaluation Metrics

| Task Dimension | Primary Objective | Annotated Properties | Official / Standard Metrics |
| :--- | :--- | :--- | :--- |
| **Privacy Recognition** | Identify sensitive UI elements in screenshot pixels. | Bounding box $(x, y, w, h)$, Category (e.g. Email, Password, Card, Phone, Avatar), Risk Level | Precision, Recall, F1-Score |
| **Privacy Localization** | Ground exact pixel boundaries of sensitive regions. | Region IoU ground-truth bounding boxes | Bounding Box IoU ($\text{IoU} \ge 0.5$) |
| **Privacy Protection** | Apply visual obfuscation to sensitive regions. | Obfuscation type (Solid Black, Gaussian Blur, Token Masking) | Redaction Coverage, Leakage Rate |
| **Task Necessity / Fidelity** | Preserve interactive controls required for task execution. | Task-Necessity flag (`mustPreserve`) on interactive controls | Task-Relevant Target Preservation Rate |
| **Protected Task Execution** | Closed-loop agent step execution on sanitized visual/DOM input. | Multimodal action plan output (Click, Type, Scroll) | Step Success Rate, Trajectory Completion Rate |

---

## 3. Input / Output & Annotation Format

### Input Specification
- Raw GUI Screenshot Image (`.png` / `.jpg`).
- User Instruction / Task Goal String (e.g. *"Fill user registration and submit"*).
- Optional Accessibility DOM Tree / Layout Hierarchy.

### Expected Output
- Region Bounding Boxes & Risk Categories.
- Sanitized Screenshot / Sanitized UI Representation.
- Structured Action Command (e.g. `click(element_id)`).

### Annotation Schema (JSON)
```json
{
  "trajectory_id": "traj_pc_web_001",
  "screenshot": "screenshots/step_01.png",
  "task": "Submit support ticket",
  "privacy_annotations": [
    {
      "bbox": [120, 80, 240, 36],
      "category": "EMAIL",
      "risk_level": "HIGH",
      "task_necessity": "NON_ESSENTIAL"
    }
  ],
  "task_relevant_controls": [
    {
      "bbox": [380, 80, 120, 40],
      "label": "Submit Ticket",
      "task_necessity": "CRITICAL"
    }
  ]
}
```

---

## 4. Publicly Available Resources & Access Restrictions

- **Paper & Documentation**: Publicly indexed on arXiv (`arXiv:2601.18842`) and project site (`futuresis.github.io/GUIGuard-page/`).
- **Dataset Hosting**: Full raw dataset (13,830 high-resolution screenshots & Android/PC trajectory logs) is hosted externally on remote repositories requiring dedicated downloads.
- **Local Environment Access**: The multi-gigabyte raw dataset is **not pre-bundled** within the local development workspace.
- **Evaluation Strategy**: As specified by Task 18 guidelines, local evaluation is conducted using a deterministic schema adapter (`benchmark/guiguard/run-guiguard-adapter.cjs`) parsing GUIGuard-compliant annotations.

---

## 5. Explicit Boundary Declaration

| Property | Directly Documented GUIGuard Specification | Our Mapping / Interpretation | Unavailable Information in Local Environment |
| :--- | :--- | :--- | :--- |
| **Framework Scope** | 3-stage (Recognition, Protection, Execution) | Direct 1-to-1 match with our Privacy Filter & Agent Loop | Native Android APK runtime environment |
| **Evaluation Domain** | Android Mobile & PC Web | Evaluated on PC / Browser Web GUI domain | Mobile Android touchscreen event dispatch |
| **Privacy Protection** | Masking sensitive bounding boxes | Adaptive Redactor (Solid Black & Gaussian Blur) | Proprietary GUIGuard server VLM weights |
