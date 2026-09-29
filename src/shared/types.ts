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

export interface OCRTelemetry {
  engine: string;
  language: string;
  initLatencyMs: number;
  inferenceLatencyMs: number;
  textSegmentsCount: number;
  piiMatchesCount: number;
  error?: string;
}

export interface OCRProvider {
  runOCR(screenshot: Blob | string, dpr?: number): Promise<{ results: OCRResult[]; telemetry: OCRTelemetry }>;
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
  protection: "BLACK" | "BLUR" | "REPLACE" | "PRESERVE";
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

export interface VisionTelemetry {
  model: string;
  runtime: 'WebGPU' | 'WASM';
  initLatencyMs: number;
  inferenceLatencyMs: number;
  totalDetections: number;
  acceptedDetections: number;
  error?: string;
}

export interface PrivacyBudgetState {
  initialBudget: number;
  consumedBudget: number;
  remainingBudget: number;
  stepCost: number;
  totalSteps: number;
  status: "active" | "exhausted";
}

export interface PrivacyCostResult {
  totalCost: number;
  regionCount: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  highestRiskCategory: string;
}

export interface AgentLoopState {
  task: string;
  step: number;
  maxSteps: number;
  startedAt: number;
  status: "running" | "completed" | "failed" | "timeout" | "max_steps" | "privacy_budget_exhausted";
  lastAction?: AgentAction;
  lastActionSignature?: string;
  repeatedActionCount: number;
  reason?: string;
}

export interface AgentPlanRequest {
  task: string;
  pageTitle?: string;
  url?: string;
  sanitizedScreenshot?: string;
  sanitizedDOM?: {
    viewport: ViewportInfo;
    elements: DOMElement[];
  };
  visibleElements: DOMElement[];
  detectedObjects?: VisionObject[];
  stepNumber?: number;
}

export interface AgentPlanResponse {
  success: boolean;
  status: "continue" | "complete";
  actions: AgentAction[];
  reasoning: string;
  error?: string;
  metrics?: {
    vlmLatencyMs: number;
    totalPlanMs: number;
  };
}

export interface StepTelemetry {
  step: number;
  timings: {
    captureMs: number;
    visionMs: number;
    ocrMs: number;
    privacyMs: number;
    redactionMs: number;
    vlmMs: number;
    actionMs: number;
    totalMs: number;
  };
  privacyCost: number;
  remainingBudget: number;
  regionCounts: Record<string, number>;
  sourceCounts: { dom: number; ocr: number; vision: number };
  redactionCounts: { black: number; blur: number; preserve: number };
  policyMode: 'NORMAL' | 'AGGRESSIVE' | 'STRICT';
  actionSummary?: {
    actionType: string;
    targetId?: string;
    durationMs: number;
    status: 'success' | 'failed';
  };
}

export interface DashboardTelemetryState {
  task: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'timeout' | 'max_steps' | 'privacy_budget_exhausted';
  currentStep: number;
  maxSteps: number;
  elapsedMs: number;
  budgetState: PrivacyBudgetState;
  detectionCounts: Record<string, number>;
  sourceCounts: { dom: number; ocr: number; vision: number };
  redactionCounts: { black: number; blur: number; preserve: number };
  policyMode: 'NORMAL' | 'AGGRESSIVE' | 'STRICT';
  upgradedVisualCount: number;
  stepHistory: StepTelemetry[];
  networkBoundary: {
    rawScreenshotBlocked: boolean;
    rawPiiBlocked: boolean;
    sanitizedContextTransmitted: boolean;
    budgetEnforced: boolean;
    transmissionStatus: 'allowed' | 'blocked';
    blockReason?: string;
  };
  abstractMapRegions: { category: string; bbox: BoundingBox; strategy: 'BLACK' | 'BLUR' | 'PRESERVE' }[];
}




