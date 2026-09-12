export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenshotData {
  image: string; 
  width: number;
  height: number;
  timestamp: number;
}

export interface SafeElement {
  id: string;
  tag: string;
  role?: string;
  label?: string;
  type?: string; // used for input type (e.g., 'email', 'password')
  bbox: BoundingBox;
}

export interface ViewportInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
}

export interface SafeDOMStructure {
  viewport: ViewportInfo;
  elements: SafeElement[];
}

export interface PageStructure {
  url: string;
  title: string;
  viewport: ViewportInfo;
  elements: SafeElement[];
}

export interface SensitiveRegion {
  type: "password" | "email" | "phone" | "pii" | "face" | "token";
  bbox: BoundingBox;
  confidence: number;
  source: "dom" | "vision" | "regex";
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
  sanitizedDOM: SafeDOMStructure;
  visibleElements: SafeElement[];
  detectedObjects?: VisionObject[];
}

export type AgentAction =
  | { type: 'click'; target: { elementId: string } }
  | { type: 'type'; target: { elementId: string }; text: string }
  | { type: 'scroll'; direction: 'up' | 'down' }
  | { type: 'navigate'; url: string }
  | { type: 'select'; target: { elementId: string }; value: string }
  | { type: 'wait'; duration: number };

