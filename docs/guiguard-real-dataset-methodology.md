# GUIGuard Real Dataset Acquisition & PC Evaluation Methodology

This document defines the formal methodology for acquiring and evaluating the official **GUIGuard-Bench** dataset (*"GUIGuard: Toward a General Framework for Privacy-Preserving GUI Agents"*, arXiv:2601.18842, Jan 2026) within the **SIH 2026 Privacy-Preserving Browser Agent** environment.

---

## 1. Dataset Acquisition Provenance

- **HuggingFace Repository ID**: `ShaofantuoshuzhengzhiSha/GUIGuard-Bench`
- **Acquisition Tooling**: Official `huggingface_hub` Python SDK (`hf_hub_download`)
- **Acquired Files**:
  - `data/eval.jsonl` (11.09 MB; 2,002 evaluation steps; 763 PC steps)
  - `image_privacy_labels_public_en.json` (17.25 MB; 2,024 annotated screenshot records; 763 PC annotated screenshots)
  - Genuine PC trajectory PNG screenshot files under `data/GUIGuard-Bench/PC/`
- **Total PC Trajectories in Repo**: 53 distinct trajectories (`PC/136` through `PC/238`)
- **Total PC Evaluation Screenshots**: 763 screenshots

---

## 2. Platform Focus & Domain Alignment

- **Primary Evaluation Domain**: **PC Web / Desktop GUI** (763 evaluation screenshots).
- **Secondary Domain (Out of Scope)**: Android Mobile OS (1,239 evaluation screenshots). Excluded because the SIH 2026 Problem Statement strictly mandates a Chrome / Firefox web browser extension architecture.
- **Domain Mismatch Note**: GUIGuard-Bench PC trajectories capture desktop workspace applications (e.g. OSWorld LibreOffice Calc, system utility windows) in addition to browser windows. Because screenshot images lack DOM tree access, privacy detection operates via local Vision DETR, Tesseract WASM OCR, visual text regex, and bounding box grounding.

---

## 3. Official Ground-Truth Annotation Processing

Ground-truth privacy annotations are parsed directly from official `image_privacy_labels_public_en.json` records:
- **Spatial Bounding Boxes**: `points: [ymin, xmin, ymax, xmax]` normalized to image pixel dimensions.
- **Risk Level**: `high_risk` vs `low_risk` / `moderate_risk`.
- **Category Labels**: `EMAIL`, `PHONE`, `PASSWORD`, `CREDIT_CARD`, `SSN`, `FACE`, `PERSON`.
- **Matching Criterion**: Bounding Box Intersection-over-Union ($\text{IoU} \ge 0.5$) with category agreement.

---

## 4. Evaluated Metrics & Formulas

1. **Privacy Detection Precision**:
   $$\text{Precision} = \frac{\text{True Positives (TP)}}{\text{True Positives (TP)} + \text{False Positives (FP)}}$$
2. **Privacy Detection Recall**:
   $$\text{Recall} = \frac{\text{True Positives (TP)}}{\text{True Positives (TP)} + \text{False Negatives (FN)}}$$
3. **Localization IoU Accuracy**: Proportion of true positive detections achieving $\text{IoU} \ge 0.5$.
4. **Redaction Coverage**: Proportion of ground-truth sensitive bounding box pixels covered by solid black or blur overlays.
5. **Network Privacy Boundary Leakage**: Interception check verifying zero raw synthetic/annotated PII strings cross the network boundary.
