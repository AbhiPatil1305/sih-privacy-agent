# SIH 2026: Privacy-Preserving Browser Agent

**Problem Statement 26171**

This repository contains the **Integration Layer (Team 1)** of our privacy-preserving browser extension. It acts as the "eyes and hands" of our AI system, capturing the user's screen and DOM, strictly filtering out personal data, sending clean data to the AI Brain, and physically executing the AI's actions.

## 🚀 Key Features

* **Advanced DOM Extraction**: Maps the physical coordinates (`x, y, width, height`) of every visible semantic element on the page.
* **Smart Geometric Deduplication**: Automatically filters out invisible, overlapping `<div>` wrappers to provide the ML team with clean, semantic data.
* **Local Privacy Engine**: Uses Regex to scrub PII (Emails, Phone Numbers) from the DOM text, and entirely ignores user-typed `value` fields.
* **On-Device Vision (OCR)**: Integrates `Tesseract.js` locally to physically read text off the screenshot pixels without sending images to the cloud.
* **Privacy Fusion Layer**: Cross-references DOM and OCR signals to generate highly accurate visual redaction boxes.
* **Visual Redactor**: Uses `OffscreenCanvas` to physically paint black boxes over sensitive data on the screenshot image *before* it leaves the browser.
* **Coordinate Alignment**: Uses `devicePixelRatio` scaling to ensure CSS DOM coordinates perfectly overlap with high-resolution image device pixels.
* **Action Executor**: Accepts structured commands (e.g., `click`, `scroll`, `type`) and autonomously drives the browser.

---

## 🛠️ Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build the Extension**
   ```bash
   npm run build
   ```

3. **Load into Chrome**
   * Go to `chrome://extensions/`
   * Enable **Developer mode**
   * Click **Load unpacked**
   * Select the `/dist` folder inside this project directory.

4. **Test the Demo**
   * Open the extension side panel on any webpage.
   * Click **Unified Capture (ML Export)** to capture the DOM, run local OCR, and preview the dynamically redacted screenshot.
   * Type a command like `"scroll down"` and click **Execute Task** to test the Action Executor.

---

## 🧩 Architecture & Core Modules

### 1. Unified Capture API (`src/capture/page-capture.ts`)
The single entry point for capturing the page. It calls the DOM Extractor script and takes a screenshot, returning a unified `PageCapture` object.

### 2. Privacy Intelligence (`src/privacy/intelligence.ts`)
The "Fusion Center". It takes raw `DOMElement[]` and `OCRResult[]` arrays, detects sensitive data, applies **Geometric Filtering** to prevent layout destruction from massive wrapper elements, and outputs precise `PrivacyRegion[]` boxes.

### 3. Redaction Engine (`src/privacy/redactor.ts`)
Takes an array of `PrivacyRegion` boxes, scales them to the physical image using the screen's `devicePixelRatio`, and paints irreversible black boxes on the image using an HTML5 `OffscreenCanvas`.

---

## 📜 Shared TypeScript Interfaces (For ML Teams)

The following interfaces are defined in `src/shared/types.ts` and represent the standardized data contracts between the Extension and the AI Model.

```typescript
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
}

// Cleaned, safe DOM element
export interface DOMElement {
  id: string;
  tag: string;
  type?: string;
  role?: string;
  label?: string; // Text is sanitized here (e.g. "[REDACTED_EMAIL]")
  bbox: BoundingBox;
}

// Vision team output
export interface OCRResult {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

// Final Redaction Box
export interface PrivacyRegion {
  id: string;
  bbox: BoundingBox;
  category: "EMAIL" | "PHONE" | "PERSON" | "PASSWORD" | "OTHER";
  protection: "BLACK" | "BLUR" | "REPLACE";
}

// The unified payload sent to the Backend/VLM
export interface SafeBrowserContext {
  pageTitle: string;
  url: string;
  sanitizedScreenshot?: string;
  sanitizedDOM: {
    viewport: ViewportInfo;
    elements: DOMElement[];
  };
  visibleElements: DOMElement[];
}
```

---
*Built for SIH 2026.*
