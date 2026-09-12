import { SensitiveRegion } from '../shared/types';

export function detectSensitiveVisualRegions(image: string): SensitiveRegion[] {
  // Placeholder for real visual PII detection (e.g., OCR -> regex, or object detection for faces)
  // Currently returns empty because vision models will be plugged in Phase 10
  return [];
}
