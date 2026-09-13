# 🛡️ Privacy-Preserving Browser Agent

**Smart India Hackathon (SIH) Prototype - Problem Statement 26171**  
*“On-device Visual Perception for Light-weight Browser Agents”*

This repository contains a production-ready MVP for a privacy-first browser agent implemented as a Chrome Extension. The architecture is explicitly designed to act as a secure, local intermediary between the user's browser and any external AI/VLM backend, ensuring that raw sensitive information is never transmitted over the network.

---

## 🛠️ Core Upgrades for ML Integration (Team 2 & Vision)

We have fully decoupled the extension's core features to allow seamless, plug-and-play integration for the Machine Learning and Backend teams.

* **Secure Memory Blobs:** The raw screenshot is now explicitly handled as a `Blob` in memory rather than a massive Base64 string, preventing accidental data leaks and optimizing performance for local models.
* **Pluggable OCR Interface:** The OCR engine is strictly abstracted behind the `OCRProvider` interface. Team 2 can swap out the default Tesseract engine for their lightweight `PP-OCRv6 Tiny` model with a single line of code.
* **External Privacy Injection:** The Privacy Redaction Engine now blindly accepts spatial coordinates (`PrivacyRegion[]`) from *any* source (DOM, OCR, or External Vision Models) and physically paints over the image.
* **Strict Server Boundaries:** The API layer is locked behind TypeScript's `SafeBrowserContext`. It is physically impossible to transmit a raw screenshot to the backend server.
* **Standardized Action Execution:** The action executor has been standardized to accept strict JSON payloads (e.g., `{"action": "click", "element_id": "el_014"}`). The browser handles the execution locally, completely preventing arbitrary JavaScript execution (`eval()`) from the cloud.

---

## 💻 How to Use the Extension

1.  **Open the Dashboard**: Click the extension icon in your Chrome toolbar to open the Side Panel.
2.  **Toggle the OCR Engine**: Use the dropdown menu to select your engine:
    *   **Mock (Fast & Safe)**: Bypasses heavy ML processing to guarantee a crash-free demo presentation. (Runs in < 2 seconds).
    *   **Tesseract.js (Real)**: Executes the actual local OCR engine against the screenshot pixels.
3.  **For the ML Team (Unified Capture)**: 
    *   Click **"Unified Capture (ML Export)"**. 
    *   The extension will map the screen, physically redact PII from the image (via DOM/OCR fusion), scrub PII from the text, and generate the final `context.json`.
4.  **For the Integration Test (Demo Mode)**: 
    *   Toggle the **"Demo"** button in the top right.
    *   When you capture the page, the system will inject a simulated "Vision Model Detection" (e.g., a fake face detection) directly into the pipeline to prove that the Redaction Engine successfully accepts and blurs external coordinates!
5.  **For the AI Demo (Execute Task)**: 
    *   Type a simple natural language command into the input box (e.g., `"scroll down"` or `"type abhi"`).
    *   Hit **Execute Task**. The local dummy-brain will parse the command into strict JSON and drive the browser autonomously!

---

## 📜 Team Contracts & Interfaces (src/shared/types.ts)

The following TypeScript interfaces are the strict contracts that Team 2 (Vision/OCR) and the Backend Team must build against.

### 1. The Raw Capture (Browser Internal)
```typescript
interface PageCapture {
  screenshot: Blob; // Handled securely in memory
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  elements: DOMElement[]; // Contains stable 'id' for action execution
}
```

### 2. Team 2: Pluggable OCR & Vision
Team 2 must implement these exact interfaces for their models to plug into the extension.
```typescript
interface OCRProvider {
  runOCR(screenshot: Blob): Promise<OCRResult[]>;
}

interface VisionProvider {
  runVision(screenshot: Blob): Promise<PrivacyRegion[]>;
}
```

### 3. The Privacy Redaction Engine
Any ML model can command the extension to redact a portion of the screen by providing an array of this object.
```typescript
interface PrivacyRegion {
  id: string;
  category: string;
  confidence: number;
  bbox: { x: number, y: number, width: number, height: number };
  source: "dom" | "ocr" | "vision" | "fusion"; // Tracks where the detection came from
  protection: "BLACK" | "BLUR" | "REPLACE";
}
```

### 4. The Strict Server Boundary
This is the ONLY data payload that the Backend/VLM server will ever receive. Notice that the raw screenshot is completely omitted.
```typescript
interface SafeBrowserContext {
  pageTitle: string;
  url: string;
  sanitizedScreenshot?: string; // The physically redacted image
  sanitizedDOM: {
    viewport: ViewportInfo;
    elements: DOMElement[]; // Text values are scrubbed (e.g. "[REDACTED_EMAIL]")
  };
  visibleElements: DOMElement[];
}
```

### 5. The Action Payload
The Backend VLM must respond with an array of actions strictly matching this JSON structure. The extension will parse the `element_id` and execute the action locally.
```json
{
  "action": "click",
  "element_id": "el_014"
}
// OR
{
  "action": "type",
  "element_id": "el_001",
  "text": "abhi"
}
// OR
{
  "action": "scroll",
  "direction": "down"
}
```
