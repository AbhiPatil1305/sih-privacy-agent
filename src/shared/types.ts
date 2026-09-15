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
  nameHint?: string;
  idHint?: string;
  bbox: BoundingBox;
}

export interface PageCapture {
  screenshot: Blob;
  viewport: ViewportInfo;
  elements: DOMElement[];
}

export interface OCRResult {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  polygon?: [number, number][];
}

export interface OCRProvider {
  runOCR(screenshot: Blob): Promise<OCRResult[]>;
}

export interface VisionProvider {
  runVision(screenshot: Blob): Promise<PrivacyRegion[]>;
}

export interface PrivacyRegion {
  id: string;
  category: string;
  confidence: number;
  bbox: BoundingBox;
  source: "dom" | "ocr" | "vision" | "fusion";
  protection: "BLACK" | "BLUR" | "REPLACE";
}

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

// --- NEW STANDARD ACTION TYPES ---

export type BrowserAction =
  | ClickAction
  | TypeAction
  | ScrollAction
  | SelectAction
  | WaitAction
  | NavigateAction;

export interface ClickAction {
  action: "click";
  element_id: string;
}

export interface TypeAction {
  action: "type";
  element_id: string;
  text: string;
}

export interface ScrollAction {
  action: "scroll";
  direction: "up" | "down";
  amount?: number;
}

export interface SelectAction {
  action: "select";
  element_id: string;
  value: string;
}

export interface WaitAction {
  action: "wait";
  duration: number;
}

export interface NavigateAction {
  action: "navigate";
  url: string;
}

export interface ActionResult {
  success: boolean;
  action: string;
  element_id?: string;
  error?: string;
  timestamp?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ActionProvider {
  getAction(task: string, context: SafeBrowserContext): Promise<{ actions: BrowserAction[], reasoning: string }>;
}
