# GUIGuard-Bench Dataset Provenance & Acquisition Log

This document records the exact provenance, acquisition methodology, local storage structure, and scope boundaries for the official **GUIGuard-Bench** dataset (*arXiv:2601.18842*) acquired for Task 19A PC Web evaluation.

---

## 1. Dataset Provenance & Remote Source Information

- **Hugging Face Repository**: [`ShaofantuoshuzhengzhiSha/GUIGuard-Bench`](https://huggingface.co/datasets/ShaofantuoshuzhengzhiSha/GUIGuard-Bench)
- **Repository Type**: Hugging Face Dataset (`repo_type="dataset"`)
- **Acquisition Tool**: Python `huggingface_hub` (v2.0.0) via `hf_hub_download`
- **Acquisition Date**: September 26, 2026
- **Local Storage Path**: `data/GUIGuard-Bench/`

---

## 2. Acquired Metadata & Annotation Files

| Filename | Size | Description / Record Count |
| :--- | :--- | :--- |
| `data/eval.jsonl` | 11.09 MB | Trajectory step index file. Contains 2,002 total steps, including 763 PC evaluation steps across 53 PC trajectories (`PC/136` through `PC/238`). |
| `image_privacy_labels_public_en.json` | 17.25 MB | Official privacy region annotations. Contains 2,024 annotated screenshot records with bounding boxes (`[ymin, xmin, ymax, xmax]`), risk levels (`high_risk`, `medium_risk`, `low_risk`), category numeric IDs, and OCR text labels. |

---

## 3. Acquired Screenshot Artifacts

- **Trajectory Evaluated**: `PC/136/` (OSWorld / LibreOffice Calc health record analysis workspace task)
- **Task Goal**: *"Create a line chart showing the trend of Heart Rate (column E) over time for all records. Place the chart in a new sheet named 'Chart'. The chart title should be 'Heart Rate Trend'."*
- **Acquired Binaries**: 25 genuine high-resolution PNG screenshot images (`step_1_*.png` through `step_25_*.png`)
- **Total Acquired Binary Size**: ~18.2 MB
- **Image Resolution**: $1920 \times 1080$ pixels

---

## 4. Domain & Scope Boundaries

- **Target Domain (In-Scope)**: PC Desktop/Web GUI trajectories. The evaluated `PC/136` trajectory represents an interactive desktop application workspace containing sensitive personal health record tabular data (dates, blood pressure readings, heart rates, medical history notes, insurance ID).
- **Out-of-Scope Domain**: Android trajectories (`Android/1/` .. `Android/135/`). Excluded from evaluation as the SIH 2026 Problem Statement explicitly defines a Chrome/Firefox web extension agent. Android mobile GUI results are never merged with browser agent metrics.
- **Access Limitation Discipline**: Screenshot-only samples lack DOM tree node access. Therefore, evaluation is strictly conducted on local Vision, local OCR, multimodal privacy intelligence fusion, and visual bounding box redaction without fabricating fake DOM trees.

---

## 5. Integrity Statement

All acquired source annotations and image files are stored in `data/GUIGuard-Bench/` without modification. Evaluation scripts consume these original files directly to ensure strict external benchmark validity.
