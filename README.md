# 🛡️ Privacy-Preserving Browser Agent

**Smart India Hackathon (SIH 2026) Prototype — Problem Statement 26171**  
*“On-Device Visual Perception for Light-Weight Browser Agents”*

[![Build Status](https://img.shields.io/badge/Build-Passing-22c55e.svg)](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/docs/task27-enhancement-evaluation.md)
[![Privacy Boundary](https://img.shields.io/badge/Privacy_Boundary-100%25_Sanitized-38bdf8.svg)](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/scratch/test-privacy-boundary.cjs)
[![Browser Support](https://img.shields.io/badge/Browsers-Chrome_%7C_Firefox-a855f7.svg)](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/docs/firefox-compatibility-audit.md)
[![Local VLM](https://img.shields.io/badge/VLM-Local_Ollama_%7C_Mock-f59e0b.svg)](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/server/server.js)

This repository contains the official, production-ready prototype for a **privacy-preserving browser agent** built for SIH Problem Statement 26171. The system consists of a dual **Chrome & Firefox WebExtension (MV3)** and a local Express microservice daemon.

The architecture establishes an **On-Device Zero-Trust Privacy Boundary**, guaranteeing that **raw screenshots, sensitive DOM text, secrets, emails, credentials, and biometric visual data are never transmitted over the network**.

---

## 📋 Comprehensive Evaluator Guide (Installation & Execution)

Follow these step-by-step instructions to install, build, run local VLMs, and evaluate the prototype.

---

### Step 1: System Requirements & Prerequisites
Before starting, ensure your system has:
- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.0.0` or higher (included with Node.js)
- **Web Browser**: Google Chrome, Brave, Microsoft Edge, or Mozilla Firefox
- *(Optional for Local VLM)*: **Ollama** ([ollama.com](https://ollama.com/)) for running local open-weights vision-language models.

---

### Step 2: Install & Configure Local VLM (Ollama)

Our server supports on-device Vision-Language Models via **Ollama**.

#### Option A: Running with Ollama (Recommended Local VLM Setup)
1. **Download & Install Ollama**:
   - **Windows**: Download and run [`OllamaSetup.exe`](https://ollama.com/download/windows) from the official website.
   - **macOS / Linux**: Run the terminal installer command:
     ```bash
     curl -fsSL https://ollama.com/install.sh | sh
     ```
2. **Pull Vision-Language Model**:
   Open your terminal and pull a local VLM (such as `qwen2-vl` or `llava`):
   ```bash
   ollama pull qwen2-vl
   ```
3. **Verify Ollama status**:
   Ensure Ollama is running locally on port `11434`:
   ```bash
   ollama list
   ```

#### Option B: Standalone Zero-Dependency Execution (Default Fallback)
If Ollama is **NOT** installed or running on your machine, **our server automatically detects this and activates an offline Mock VLM Planner.**
- **No extra GPU, setup, or API keys required.**
- Guarantees an immediate, 100% crash-free evaluation out-of-the-box.

---

### Step 3: Clone Repository & Install Dependencies

```bash
# 1. Clone the official repository from GitHub
git clone https://github.com/AbhiPatil1305/sih-privacy-agent.git

# 2. Navigate into the project directory
cd sih-privacy-agent

# 3. Install project dependencies
npm install
```

---

### Step 4: Build Extension Packages

Build the extension bundles for Chrome and Firefox:

```bash
# Build Chrome MV3 Extension (Generates bundle in dist/)
npm run build

# Build Firefox MV3 Extension (Generates bundle in dist-firefox/)
npm run build:firefox
```

---

### Step 5: Start Local Server Daemon

Start the server daemon on `http://localhost:3000`:

```bash
npm start
```

*Terminal Output Verification*:
```text
🤖 SIH Agent Server (VLM Enabled) running on http://localhost:3000
📄 Test page available at http://localhost:3000/sih-demo.html
```

---

### Step 6: Load Extension into Browser

#### 🌐 Loading in Google Chrome / Chromium Browsers (Brave, Edge)
1. Open Chrome and navigate to `chrome://extensions`.
2. Turn ON **Developer mode** (top-right toggle switch).
3. Click **Load unpacked** in the top left.
4. Select the [`dist/`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/dist) directory from this project folder.
5. Pin the **Privacy Agent V2** extension icon in your toolbar and click it to open the Sidepanel.

#### 🦊 Loading in Mozilla Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `dist-firefox/manifest.json` file from this project folder.

---

### Step 7: Live Evaluation on SIH Test Portal

1. Keep the server running (`npm start`) and open the test portal in your browser:
   ```text
   http://localhost:3000/sih-demo.html
   ```
2. Open the **Privacy Agent Sidepanel** by clicking the extension icon.
3. Observe the **Client Resource Telemetry**:
   - **JS Heap Memory**: Real-time memory consumption (MB).
   - **Runtime Mode**: `WebGPU Mode` (Accelerated) or `WASM Mode` (Fallback).
   - **Preprocess Timer**: On-device perception duration (ms).
4. Enter an automated task in the input box:
   ```text
   "Search user records and submit application"
   ```
5. Click **Execute Task**:
   - The extension captures the screen, runs local `ONNX DETR` visual object detection + `Tesseract WASM OCR` in parallel, applies destructive canvas pixel redaction (**solid BLACK** for Aadhaar/PAN/Card secrets; **Gaussian BLUR** for photos/avatars), scrubs DOM text nodes (`[REDACTED_AADHAAR]`), and sends only sanitized context to the server.
   - The server planner returns JSON action commands (`type`, `click`), which the browser executes locally.
6. Toggle **Inspector Overlay** to view color-coded bounding-box debug visualization directly on the page:
   - 🟢 **Green Boxes**: DOM Regex Detections
   - 🔵 **Blue Boxes**: ONNX DETR Object Detections
   - 🔴 **Red Boxes**: Tesseract WASM OCR Detections

---

## 🧪 Running Automated Evaluation & Regression Benchmarks

To independently verify performance, privacy boundaries, and regression suites, run the included evaluation scripts:

```bash
# 1. Run Complete Automated Validation Suite (Tasks 5-13 & Build Checks)
npm test

# 2. Run Indian PII Synthetic Evaluation (Aadhaar, PAN, IFSC, Passport, Phone)
node scratch/test-indian-pii-eval.cjs

# 3. Run Parallel Perception Latency Benchmark (Sequential vs Parallel Promise.all)
node scratch/test-parallel-benchmark.cjs

# 4. Run GUIGuard-Bench Real-World Trajectory Evaluation
node benchmark/run-task12-eval.cjs
```

---

## 🌟 Key Features & Architectural Highlights

### 1. On-Device Multi-Modal Perception
- **Local Vision Transformer / DETR**: Executes `Xenova/detr-resnet-50` ONNX object detection locally inside browser worker contexts with **WebGPU acceleration** and WASM fallback.
- **WASM OCR Engine**: Integrates local `Tesseract.js` WASM engine for in-image text extraction.
- **Parallel Perception Pipeline**: Runs neural vision and OCR concurrently via `Promise.all()`, reducing client perception latency by **~45%** (median warm latency 40 ms).

### 2. Comprehensive PII Detection & Destructive Redaction
- **Indian & Global PII Rules**: Dynamically detects **Aadhaar Numbers**, **PAN Cards**, **Bank IFSC Codes**, **Passport Numbers**, **Indian Phones (+91)**, **Credit Cards**, **Passwords**, **SSNs**, and **Email Addresses**.
- **Destructive Canvas Masking**: Physically alters pixel data on an HTML5 canvas (**solid BLACK** for secret credentials; **Gaussian BLUR** for faces, portraits, and avatars).
- **DOM Tree Tokenization**: Replaces sensitive text nodes in exported DOM with structural tokens (`[REDACTED_AADHAAR]`, `[REDACTED_PAN]`).

### 3. Zero-Trust Network Boundary
- Enforces strict static serialization boundaries ([`SafeBrowserContext`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/src/shared/types.ts#L85)).
- **0 Raw Image Bytes & 0 Unmasked PII Bytes** are ever sent to remote VLM servers.

---

## 📜 Technical Architecture Diagram

```
                               ┌─────────────────────────────────────────────────────────┐
                               │                    CLIENT BROWSER                       │
                               │                                                         │
  ┌──────────────┐             │  ┌─────────────────┐       ┌─────────────────────────┐  │             ┌─────────────────┐
  │ User Prompt  │────────────►│  │  Agent Loop     │──────►│ On-Device AI Perception │  │             │ Local VLM Server│
  └──────────────┘             │  │ Service Worker  │       │ (DETR-ResNet + OCR +    │  │             │ (Ollama / Mock) │
                               │  └─────────────────┘       │  DOM Spatial Fusion)    │  │             └─────────────────┘
                               │             ▲              └─────────────────────────┘  │                      ▲
                               │             │                           │               │                      │
                               │             │              ┌────────────▼────────────┐  │                      │
                               │             │              │ Destructive Redaction   │  │                      │
                               │             │              │ (Canvas + Text Scrub)   │  │                      │
                               │             │              └────────────┬────────────┘  │                      │
                               │             │                           │               │                      │
                               │  ┌──────────┴──────────┐   ┌────────────▼────────────┐  │   Safe Context Payload   │
                               │  │ Local DOM Execution │◄──│ Zero-Trust Egress Layer │  ├──────────────────────┘
                               │  │ (Click, Type, etc.) │   │ (No Raw Data Allowed)   │  │   (Sanitized Image + DOM)
                               │  └─────────────────────┘   └─────────────────────────┘  │
                               │                                                         │
                               └─────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
sih-privacy-agent/
├── manifest.json              # Primary Chrome MV3 Extension Manifest
├── vite.config.ts             # Vite build & bundle configuration
├── package.json               # NPM scripts & dependencies
├── .env.example               # Environment configuration template
├── public/
│   └── sih-demo.html          # SIH 2026 Interactive Test Portal
├── scripts/
│   └── build-firefox.cjs      # Firefox MV3 manifest transformer & builder
├── src/
│   ├── background/            # Service worker & agent loop state machine
│   ├── capture/               # Viewport capture helpers
│   ├── content/               # DOM extraction, inspector overlay, action execution
│   ├── network/               # Zero-trust HTTP client for VLM server
│   ├── platform/              # Cross-browser API adapter (chrome / browser)
│   ├── popup/                 # React UI dashboard & telemetry components
│   ├── privacy/               # Redactor, DOM sanitizer, Indian/Global PII rules, budget
│   ├── shared/                # Shared TypeScript types & team contracts
│   └── vision/                # ONNX Transformers.js DETR & Tesseract WASM OCR engines
├── server/                    # Express VLM server (Ollama, Mock VLM, OpenAI, OpenRouter)
├── benchmark/                 # Automated evaluation scripts & GUIGuard-Bench suite
└── docs/                      # Technical documentation & evaluation reports
```

---

## 📊 Verification & Evaluation Benchmark Summary

| Evaluation Dimension | Metric / Result | Evidence File |
| :--- | :--- | :--- |
| **Indian & Global PII Recall** | **100.0% Recall** (Aadhaar, PAN, IFSC, Passport, Phone, Email, Cards) | [`scratch/test-indian-pii-eval.cjs`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/scratch/test-indian-pii-eval.cjs) |
| **PII Detection Precision** | **94.59% Precision** on 50-item synthetic corpus | [`docs/task27-enhancement-evaluation.md`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/docs/task27-enhancement-evaluation.md) |
| **Perception Latency** | **40 ms Warm Median** (+45.21% parallel improvement) | [`scratch/test-parallel-benchmark.cjs`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/scratch/test-parallel-benchmark.cjs) |
| **Network Privacy Boundary** | **0 Raw Image Bytes / 0 Raw PII Transmitted** (14/14 tests pass) | [`scratch/test-privacy-boundary.cjs`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/scratch/test-privacy-boundary.cjs) |
| **GUIGuard-Bench Evaluation** | **75.86% Precision \| 42.31% Recall \| 97.40% Task Control Preservation** | [`docs/final-sih-evidence-claim-matrix.md`](file:///c:/Users/kened/Desktop/abhis/sih-privacy-agent/docs/final-sih-evidence-claim-matrix.md) |

---

## 📄 Team Credits & SIH Problem Statement Details

Developed for **Smart India Hackathon (SIH 2026)** — Problem Statement 26171.  
*Mentors*: Gulshan Gupta (`gulshang@sac.isro.gov.in`), Navita Jayesh Thakkar (`navitat@sac.isro.gov.in`).
