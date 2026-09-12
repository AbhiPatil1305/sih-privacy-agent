import { SensitiveRegion } from '../shared/types';

export function mergeBoundingBoxes(regions: SensitiveRegion[]): SensitiveRegion[] {
  // Simplistic implementation: just returns all regions.
  // A robust implementation would merge overlapping boxes (IoU calculation).
  return regions;
}
