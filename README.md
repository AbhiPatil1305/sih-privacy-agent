# 🛡️ Privacy-Preserving Browser Agent

**Smart India Hackathon (SIH) Prototype - Problem Statement 26171**  
*“On-device Visual Perception for Light-weight Browser Agents”*

This repository contains a production-ready MVP for a privacy-first browser agent implemented as a Chrome Extension. The architecture is explicitly designed to act as a secure, local intermediary between the user's browser and any external AI/VLM backend, ensuring that raw sensitive information is never transmitted over the network.

## 🚀 Key Features

*   **Local DOM & Screenshot Extraction**: Efficiently captures viewport dimensions, semantic DOM elements, and a screenshot of the active tab.
*   **On-Device PII Sanitization (Privacy First)**: Detects and physically redacts sensitive UI regions (e.g., Passwords, Emails, Credit Cards, SSN) locally using `OffscreenCanvas` and Regex pipelines *before* generating context payloads.
*   **Visual DOM Deduplication**: Intelligently drops overlapping invisible `<div>` wrappers to provide clean, semantic bounding boxes for the ML model.
*   **Strict Input Filtering**: Never records or extracts `value` attributes or user-typed text from input fields.
*   **Coordinate Mapping Engine**: Ensures pixel-perfect alignment between standard DOM Viewport Coordinates and `devicePixelRatio` scaled screenshots.
*   **React Side Panel Dashboard**: Provides real-time metrics, privacy logs, execution timelines, and a visual Demo Mode showing Original vs Sanitized screenshots.
*   **Mock Planning API**: Includes a lightweight Mock AI that translates natural language tasks (like "Scroll down" or "Type hello") into structured JSON actions (`AgentAction`), which are then validated and executed programmatically.

---

## 🛠️ Tech Stack

*   **Frontend / UI**: React 18, TypeScript, Lucide Icons
*   **Build Tool**: Vite + CRXJS (Manifest V3)
*   **Vision / ML Readiness**: `@xenova/transformers` (Configured for WebGPU/WASM injection for Phase 10 integration)
*   **Browser APIs**: `chrome.scripting`, `chrome.tabs`, `chrome.sidePanel`, `chrome.runtime`

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AbhiPatil1305/sih-privacy-agent.git
   cd sih-privacy-agent
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build the extension**:
   ```bash
   npm run build
   ```
4. **Load into Chrome**:
   * Open Google Chrome and go to `chrome://extensions/`.
   * Enable **Developer mode** (top right corner).
   * Click **Load unpacked** (top left).
   * Select the generated `dist` folder located inside the project directory.

---

## 💻 Usage

1. Pin the **Privacy Agent V1** extension to your Chrome toolbar.
2. Navigate to a normal webpage (e.g., a login form or dashboard). *Note: Extension cannot run on internal `chrome://` pages.*
3. Click the extension icon to open the **Side Panel Dashboard**.

### For ML / Vision Teams (Phase 1+2)
Click the **"Analyze Page (For ML Team)"** button to run the extraction and privacy pipeline. The extension will automatically download two files:
*   `screenshot.png` - The locally sanitized viewport image.
*   `context.json` - The deduplicated, PII-scrubbed structural mapping containing `viewport` metadata and semantic `elements`.

### For Agent Simulation
Type a natural language command into the input box and click **Execute Task**. The system will extract, sanitize, send context to the Mock API, and perform the resulting action on the page. 
*Example commands:*
*   `Scroll down`
*   `Click login`
*   `Type hello`

---

## 🔒 Privacy Architecture Output (`context.json`)

To ensure compliance with SIH PS26171, the generated JSON structure deliberately omits values and scrubs PII text.

```json
{
  "viewport": {
    "width": 1440,
    "height": 900,
    "devicePixelRatio": 1
  },
  "elements": [
    {
      "id": "el_001",
      "tag": "input",
      "type": "email",
      "label": "Email",
      "bbox": {
        "x": 410,
        "y": 280,
        "width": 350,
        "height": 45
      }
    }
  ]
}
```
