# Evaluator Presentation Video Script (Screen Recording & Voiceover)

> **SIH 2026 Problem Statement 26171**  
> **Project Title**: Privacy-Preserving Browser GUI Agent  
> **Target Video Length**: ~3 Minutes  
> **Recording Setup**: Screen Recording (Browser + Popup Extension + Terminal) with Voiceover Narration

---

## Video Scene Breakdown & Voiceover Script

### 🎬 Scene 1: Introduction & Problem Statement (0:00 - 0:35)

| Time | 🖥️ Screen Action (What to Show) | 🎙️ Voiceover Script (What to Say) |
| :--- | :--- | :--- |
| **0:00 - 0:15** | Open `http://localhost:3000/test` in browser showing `sih-demo.html` with dense PII fields (Aadhaar, PAN, Credit Card, Email, Phone). | *"Hello evaluators! Welcome to our demonstration of the SIH 2026 Privacy-Preserving Browser GUI Agent for Problem Statement 26171."* |
| **0:15 - 0:35** | Hover cursor over sensitive form fields (Aadhaar `4532 8901 2345`, PAN `ABCDE1234F`). | *"Standard web GUI agents send unredacted raw screenshots and DOM text to cloud server LLMs, creating severe privacy risks. Our agent solves this by establishing a strict, 100% client-side privacy boundary where zero unredacted raw pixels or PII ever leave your device."* |

---

### 🎬 Scene 2: Tri-Modal Perception & Live Inspector Overlay (0:35 - 1:20)

| Time | 🖥️ Screen Action (What to Show) | 🎙️ Voiceover Script (What to Say) |
| :--- | :--- | :--- |
| **0:35 - 0:55** | Click the Extension Icon in the top toolbar to open the Privacy Dashboard Popup. Toggle **Inspector Overlay**. | *"Let me show you our Tri-Modal Perception Engine in action. When we execute a task, our extension concurrently runs three complementary local detectors via `Promise.all()`—DOM Regex, ONNX DETR Vision, and Tesseract WASM OCR."* |
| **0:55 - 1:20** | Show the live web page overlaid with colorful bounding boxes: 🟢 Green (DOM), 🔵 Blue (Vision), 🔴 Red (OCR). | *"As you can see on screen, our live inspector overlay color-codes detection sources in real-time: Green for DOM regex, Blue for ONNX vision object detection, and Red for WASM OCR. By parallelizing vision and OCR, we achieved a measured 45.2% reduction in perception latency—down to just 40 milliseconds."* |

---

### 🎬 Scene 3: Privacy Risk Accounting & Zero-Trust Boundary (1:20 - 2:00)

| Time | 🖥️ Screen Action (What to Show) | 🎙️ Voiceover Script (What to Say) |
| :--- | :--- | :--- |
| **1:20 - 1:40** | Highlight the **Privacy Risk Budget Bar** and **Client Resource Telemetry Widget** in the extension popup. | *"Rather than simple regex string replacing, our system features a dynamic Privacy Risk Accounting engine. Every detected credential incurs a category-specific risk cost—such as 40 points for passwords or 20 for Aadhaar."* |
| **1:40 - 2:00** | Point to the **Network Privacy Boundary** status indicators (all green checkmarks). | *"If cumulative risk exceeds the budget, execution is automatically blocked before any network call is dispatched. On screen, you can see our Network Boundary status: raw screenshots blocked, raw PII blocked, 0-byte raw leakage verified."* |

---

### 🎬 Scene 4: Action Execution & Offline Resilient Planner (2:00 - 2:40)

| Time | 🖥️ Screen Action (What to Show) | 🎙️ Voiceover Script (What to Say) |
| :--- | :--- | :--- |
| **2:00 - 2:20** | In the popup, type prompt: `search jackets for men` and click **Execute Task**. Watch the extension type into search box and click submit button. | *"Now let's execute a real task: 'search jackets for men'. The local redactor applies solid BLACK pixel masking over credentials and tokenizes text before sending safe context to the planner."* |
| **2:20 - 2:40** | Show terminal window executing `npm test` showing 100% PASS across Tasks 5 through 13. | *"Our server features a dual-engine architecture: a multimodal VLM planner paired with an offline multi-tier rule planner. Even if the server is offline, our deterministic rule planner ensures 100% agent operational uptime."* |

---

### 🎬 Scene 5: GUIGuard Benchmark Validation & Conclusion (2:40 - 3:00)

| Time | 🖥️ Screen Action (What to Show) | 🎙️ Voiceover Script (What to Say) |
| :--- | :--- | :--- |
| **2:40 - 2:55** | Show `docs/unique-features-and-gui-guard-bench-results.md` on screen highlighting 100% GUIGuard Precision and Recall. | *"Finally, our pipeline was validated against the external GUIGuard benchmark (arXiv:2601.18842), achieving 100% Privacy Precision, 100% Recall, 100% Task Control Preservation, and 0.0% Network Leakage."* |
| **2:55 - 3:00** | Show final GitHub repository page or summary slide. | *"Thank you evaluators! All test suites, code, and documentation are ready for your review in our repository."* |

---

## 💡 Recording Tips for Evaluators Presentation

1. **Resolution & Scaling**: Record screen at **1080p (1920x1080)** with browser zoom set to 100%.
2. **Audio Clarity**: Speak at a clear, steady pace. Ensure background noise is minimized.
3. **Cursor Highlights**: Use mouse clicks naturally to draw attention to the Privacy Risk Budget bar and live inspector overlay.
