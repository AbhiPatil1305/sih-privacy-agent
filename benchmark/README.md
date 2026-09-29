# SIH 2026 Privacy Agent — Benchmark Suite

This directory contains a local, repeatable benchmarking harness for evaluating the privacy-preserving browser agent system.

---

## Benchmark Metrics Overview

The harness measures 9 key dimensions without altering production logic:

1. **PII Detection Recall**: $\text{TP} / (\text{TP} + \text{FN})$ at IoU $\ge 0.5$.
2. **PII Detection Precision**: $\text{TP} / (\text{TP} + \text{FP})$ across DOM, OCR, Vision, and fused pipelines.
3. **Redaction Coverage**: Percentage of ground-truth sensitive region area covered by visual redactions.
4. **Visual Context Preservation**: Percentage of non-sensitive page area preserved (False Redaction Rate = $\text{Redacted Safe Area} / \text{Total Safe Area}$).
5. **Processing Latency**: Microsecond-accurate latency measurements across capture, vision, OCR, fusion, budget, redaction policy, DOM sanitization, and network stages ($N=10$ trials: Mean, Median, P95).
6. **Client Resource Usage**: Memory usage and cold vs. warm model initialization timings.
7. **Privacy Budget Accounting**: Multi-budget scenarios ($100, 50, 20, 0$) verifying budget consumption and pre-network exhaustion boundaries.
8. **Adaptive Redaction Policy**: Verification of semantic protection levels (`STRICT`, `MODERATE`, `MINIMAL`) across `NORMAL`, `AGGRESSIVE`, and `STRICT` budget modes.
9. **Multi-Step Agent Reliability**: Completion rates, average step counts, and termination reasons across multi-step scenarios.

---

## Directory Structure

```text
benchmark/
├── README.md                  # Benchmark suite documentation & methodology
├── fixtures/
│   └── synthetic-fixtures.json # Ground-truth synthetic DOM, OCR, and Vision test cases
├── results/
│   ├── latest.json            # Machine-readable JSON benchmark execution output
│   └── latest.md              # Human-readable Markdown summary report
└── run-benchmark.js           # Automated benchmark execution script
```

---

## Ground-Truth Methodology

Synthetic test fixtures contain known bounding boxes and categories. Ground truth is **independent** of detector output to prevent circular evaluation.

- **Matching Rule**: A detected region matches a ground-truth region if `detected.category === groundTruth.category` AND `IoU(bbox_D, bbox_G) >= 0.5`.
- **Intersection over Union (IoU)**:
  $$\text{IoU} = \frac{\text{Area}(D \cap G)}{\text{Area}(D \cup G)}$$

---

## Execution Instructions

To execute the benchmark suite and generate updated metrics:

```bash
node benchmark/run-benchmark.js
```

Results will be written to `benchmark/results/latest.json` and `benchmark/results/latest.md`.

---

## Privacy Invariant Guarantee

- **Local Execution Only**: Synthetic benchmark fixtures and execution traces remain 100% client-side.
- **Zero Raw PII External Leakage**: Ground-truth values are synthetic and never transmitted to remote endpoints or VLM models during benchmark runs.
