# SIH 2026 Optimization Baseline

This document records the exact baseline measurements from Task 12 and Task 14 evaluations prior to initiating Task 16 measurement-driven profiling and optimization analysis.

---

## Authoritative Pre-Optimization Baseline Metrics

| Category | Metric | Measured Baseline | Target Standard / Status |
| :--- | :--- | :--- | :--- |
| **Visual Context Preservation** | Non-sensitive visual area preserved | **98.42%** | High fidelity visual background retention |
| | Task-relevant UI element preservation | **100.00%** | Zero task-relevant action targets obfuscated |
| **PII Detection Accuracy** | Precision (Synthetic Fixtures) | **100.00%** | Zero false-positive PII tokens |
| | Recall (Synthetic Fixtures) | **100.00%** | Zero missed PII occurrences |
| **Redaction Performance** | Sensitive region coverage | **100.00%** | Complete obfuscation of all detected PII |
| | False-redaction rate | **0.00%** | Zero non-sensitive interactive elements masked |
| **Client Efficiency** | Median warm local preprocessing latency | **74.15 ms** | Sub-100ms local visual/DOM pipeline |
| | Node / Extension JS Heap usage | **24.85 MB** | Minimal background RAM footprint |
| | WASM / WebWorker Memory Note | Isolated Native Heap | Web Worker & WebGPU heap isolated in tab process |
| **End-to-End Latency** | Median closed-loop step latency | **94.75 ms** | End-to-end task execution speed |
| **Payload Optimization** | Network payload size reduction | **28.87%** | Base64 PNG vs raw screenshot bandwidth saving |

---

## Baseline Observations

1. **Local Preprocessing Latency**: 74.15 ms median local processing accounts for the majority of the 94.75 ms closed-loop step latency (in Mock VLM evaluation mode).
2. **Visual Area Loss (1.58%)**: 98.42% preservation means 1.58% of non-sensitive canvas area is covered by solid or blur overlays. We will investigate whether this 1.58% is due to intentional blur expansion, bounding box padding, or measurement artifacts.
3. **Memory Footprint**: 24.85 MB JS heap is lightweight and well within standard browser extension allocations (< 100 MB).
