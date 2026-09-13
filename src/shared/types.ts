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

export type AgentAction =
  | { action: 'click'; element_id: string }
  | { action: 'type'; element_id: string; text: string }
  | { action: 'scroll'; direction: 'up' | 'down' }
  | { action: 'navigate'; url: string }
  | { action: 'select'; element_id: string; value: string }
  | { action: 'wait'; duration: number };
