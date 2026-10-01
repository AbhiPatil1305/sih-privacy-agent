# Key Novelty Points (PPT Presentation Slide)

> **SIH 2026 Problem Statement 26171**  
> **Project Title**: Privacy-Preserving Browser GUI Agent

---

## 🌟 Top 5 Novelty & Innovation Points (Slide Ready)

### 1. 🔒 Zero-Trust Client-Side Privacy Boundary
- **Novelty**: Performs **100% local perception, visual redaction, and DOM text tokenization** inside the browser before any network dispatch.
- **Impact**: **0-byte raw pixel leakage** and **0 unredacted PII strings** ever leave the user's browser, eliminating server-side privacy risks.

### 2. ⚡ Tri-Modal Parallel Hybrid Perception (DOM + Vision + OCR)
- **Novelty**: Fuses 3 complementary perception modalities (DOM Regex + ONNX DETR Vision + Tesseract WASM OCR) concurrently via `Promise.all()`.
- **Impact**: Achieves **45.21% perception latency reduction** (73 ms → 40 ms median) with spatial $\text{IoU} \ge 0.5$ deduplication.

### 3. 📊 Dynamic Privacy Risk Accounting & Budget Guard
- **Novelty**: Replaces naive string replacement with an **engineering risk budget engine** that calculates real-time cumulative exposure per step.
- **Impact**: Automatically **blocks network dispatch** if cumulative risk cost exceeds the step budget, preventing catastrophic PII leakage.

### 4. 🇮🇳 Localized Indian National PII Intelligence
- **Novelty**: First-of-its-kind specialized recognition tuned for Indian national identity credentials (**Aadhaar**, **PAN Card**, **Bank IFSC**, **Passports**, **Phone Numbers**).
- **Impact**: Delivers **100.0% Recall** and **94.59% Precision** on synthetic Indian identity test corpora.

### 5. 🛡️ Dual-Engine Resilient Action Execution
- **Novelty**: Hybrid architecture pairing server-side Multimodal VLM planning with a **deterministic offline multi-tier rule planner**.
- **Impact**: Guarantees **100% agent operational uptime** even when the local VLM server is completely offline or unpopulated.
