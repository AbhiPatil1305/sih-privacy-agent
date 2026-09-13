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

export interface DOMElement {
  id: string;
  tag: string;
  type?: string;
  role?: string;
  label?: string;
  text?: string;
  bbox: BoundingBox;
}

export interface PageCapture {
  screenshot: string; // Base64 Data URL for now
  viewport: ViewportInfo;
  elements: DOMElement[];
}

// ---- TEAM 2 (OCR) INTERFACES ----
export interface OCRResult {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  polygon?: [number, number][];
}

export interface OCRProvider {
  runOCR(screenshot: string): Promise<OCRResult[]>;
}

// ---- PRIVACY INTELLIGENCE INTERFACES ----
export interface PrivacyRegion {
  id: string;
  bbox: BoundingBox;
  category: "EMAIL" | "PHONE" | "PERSON" | "PASSWORD" | "ADDRESS" | "OTHER";
  confidence: number;
  protection: "BLACK" | "BLUR" | "REPLACE";
}

// ---- AGENT INTERFACES ----
export interface VisionObject {
  id: string;
  label: string;
  bbox: BoundingBox;
}

export interface SafeBrowserContext {
  pageTitle: string;
  url: string;
  sanitizedScreenshot?: string;
  sanitizedDOM: {
    viewport: ViewportInfo;
    elements: DOMElement[];
  };
  visibleElements: DOMElement[];
  detectedObjects?: VisionObject[];
}

export type AgentAction =
  | { type: 'click'; target: { elementId: string } }
  | { type: 'type'; target: { elementId: string }; text: string }
  | { type: 'scroll'; direction: 'up' | 'down' }
  | { type: 'navigate'; url: string }
  | { type: 'select'; target: { elementId: string }; value: string }
  | { type: 'wait'; duration: number };

