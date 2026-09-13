# 🛡️ Privacy-Preserving Browser Agent

**Smart India Hackathon (SIH) Prototype - Problem Statement 26171**  
*“On-device Visual Perception for Light-weight Browser Agents”*

This repository contains a production-ready MVP for a privacy-first browser agent implemented as a Chrome Extension. The architecture is explicitly designed to act as a secure, local intermediary between the user's browser and any external AI/VLM backend, ensuring that raw sensitive information is never transmitted over the network.

---

## 🛠️ Languages & Tech Stack

*   **TypeScript / JavaScript**: The primary programming language used for the entire project. TypeScript provides strong typing to prevent bugs and ensure strictly formatted data payloads.
*   **React 18**: The frontend library used to build the interactive Side Panel Dashboard UI.
*   **Vite & CRXJS**: A lightning-fast build tool paired with a specialized plugin to seamlessly build Chrome Extensions using the modern Manifest V3 standard.
*   **Chrome Extension APIs (Manifest V3)**:
    *   *Service Workers (`background.ts`)*: Runs in the background to handle tasks like capturing the screen.
    *   *Scripting API (`chrome.scripting`)*: Used to inject our DOM extraction code directly into the webpage on command.
    *   *Side Panel API (`chrome.sidePanel`)*: Allows our React dashboard to stay open persistently on the side of the browser.
*   **OffscreenCanvas**: A specialized browser API used to physically paint black redaction boxes over sensitive screenshots in the background, ensuring privacy *before* the image is saved.
*   **Transformers.js (`@xenova/transformers`)**: Pre-configured to run local AI models directly in the browser (via WebGPU/WASM), preparing the extension for Phase 10 (Local Vision Model).
*   **Lucide-React**: An open-source icon library used for professional UI elements.

---

## 🧠 Core Components & Architecture

1.  **DOM Extractor (`injectedDOMExtractor`)**
    *   Injects itself into the active webpage to map the physical coordinates (`x, y, width, height`) of every visible UI element.
    *   Includes a **Visual Deduplication Engine** that ignores invisible overlapping layers to give the ML model clean data. Crucially, it intentionally ignores actual user-typed `value` data to maintain strict privacy.
2.  **Privacy Pipeline (`dom-detector.ts` & `dom-sanitizer.ts`)**
    *   Scans extracted data for Personally Identifiable Information (PII) like emails, passwords, and phone numbers using Regex and structural rules.
    *   If it finds PII, it redacts the text (e.g., replaces it with `[REDACTED_EMAIL]`) and flags the visual coordinates for image redaction.
3.  **Mock AI Agent (`api-client.ts`)**
    *   Acts as a placeholder for the ML model. It reads natural language commands and matches them against the extracted DOM to return a structured machine action.
4.  **Action Executor (`injectedActionExecutor`)**
    *   Takes the planned action from the AI (e.g., `click element el_014`) and physically executes the click or scroll on the actual webpage.

---

## 💻 How to Use the Extension

1.  **Open a Webpage**: Navigate to any normal website (e.g., a login page or Google). *Note: Extensions cannot run on internal browser settings pages like `chrome://`.*
2.  **Open the Dashboard**: Click the extension icon in your Chrome toolbar. The sleek Privacy Agent dashboard will open in the side panel.
3.  **For the ML Team (Analyze Page)**: 
    *   Click the **"Analyze Page"** button. 
    *   The extension will map the screen, physically redact PII from the image, scrub PII from the text, and automatically download two files: `screenshot.png` and a perfectly structured, sanitized `context.json`.
4.  **For the AI Demo (Execute Task)**: 
    *   Type a natural language command into the input box and hit **Execute Task**.
    *   Type `"Scroll down"` to see it manipulate the page.
    *   Type `"Click [name of a button on screen]"` (e.g., "Click login") to see the agent autonomously find the button and click it!
5.  **Demo Mode**: Toggle the "Demo" button in the top right of the dashboard to see a side-by-side visual comparison of the original screenshot and the privacy-sanitized screenshot.

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

---

## 📦 Installation for Developers

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
   * Go to `chrome://extensions/`.
   * Enable **Developer mode**.
   * Click **Load unpacked** and select the `dist` folder.
