import { PrivacyRegion, PrivacyBudgetState, PrivacyCostResult } from '../shared/types';

/**
 * DEFAULT PRIVACY RISK BUDGET
 * Note: This is an engineering risk accounting budget, NOT formal differential privacy epsilon (ε).
 */
export const DEFAULT_PRIVACY_BUDGET = 100;

/**
 * Centralized Privacy Risk Cost Table
 * Maps PrivacyRegion categories to engineering heuristic risk cost units.
 */
export const PRIVACY_RISK_COSTS: Record<string, number> = {
  EMAIL: 10,
  PHONE: 10,
  SSN: 25,
  CREDIT_CARD: 30,
  PASSWORD: 40,
  PERSON: 10,
  FACE: 15,
  AVATAR: 10,
  VISUAL_PII: 15,
  OTHER: 20,
  OTHER_SENSITIVE: 20
};

/**
 * Checks spatial overlap between two detected privacy regions of the same category
 * to prevent double-charging duplicate detections across DOM, OCR, and Vision.
 */
function isDuplicateRegion(r1: PrivacyRegion, r2: PrivacyRegion): boolean {
  if (r1.category.toUpperCase() !== r2.category.toUpperCase()) return false;
  
  const xOverlap = Math.max(0, Math.min(r1.bbox.x + r1.bbox.width, r2.bbox.x + r2.bbox.width) - Math.max(r1.bbox.x, r2.bbox.x));
  const yOverlap = Math.max(0, Math.min(r1.bbox.y + r1.bbox.height, r2.bbox.y + r2.bbox.height) - Math.max(r1.bbox.y, r2.bbox.y));
  const intersection = xOverlap * yOverlap;
  if (intersection <= 0) return false;

  const r1Area = r1.bbox.width * r1.bbox.height;
  const r2Area = r2.bbox.width * r2.bbox.height;
  const union = r1Area + r2Area - intersection;
  return union > 0 ? (intersection / union) > 0.5 : false;
}

/**
 * Calculates cumulative privacy exposure cost for a set of fused PrivacyRegions.
 */
export function calculatePrivacyCost(regions: PrivacyRegion[]): PrivacyCostResult {
  // Deduplicate overlapping regions of the same category
  const uniqueRegions: PrivacyRegion[] = [];
  for (const reg of regions) {
    const isDup = uniqueRegions.some(existing => isDuplicateRegion(existing, reg));
    if (!isDup) {
      uniqueRegions.push(reg);
    }
  }

  let totalCost = 0;
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let highestRiskCategory = "NONE";
  let maxCatCost = -1;

  for (const reg of uniqueRegions) {
    const cat = reg.category.toUpperCase();
    const cost = PRIVACY_RISK_COSTS[cat] !== undefined ? PRIVACY_RISK_COSTS[cat] : (PRIVACY_RISK_COSTS.OTHER_SENSITIVE || 20);

    totalCost += cost;

    byCategory[cat] = (byCategory[cat] || 0) + cost;
    bySource[reg.source] = (bySource[reg.source] || 0) + cost;

    if (cost > maxCatCost) {
      maxCatCost = cost;
      highestRiskCategory = cat;
    }
  }

  return {
    totalCost,
    regionCount: uniqueRegions.length,
    byCategory,
    bySource,
    highestRiskCategory
  };
}

/**
 * Client-Side Privacy Budget Manager for tracking cumulative privacy risk exposure across a task.
 */
export class PrivacyBudgetManager {
  private initialBudget: number;
  private consumedBudget: number;
  private stepCount: number;

  constructor(initialBudget: number = DEFAULT_PRIVACY_BUDGET) {
    this.initialBudget = initialBudget;
    this.consumedBudget = 0;
    this.stepCount = 0;
  }

  public get state(): PrivacyBudgetState {
    const remaining = Math.max(0, this.initialBudget - this.consumedBudget);
    return {
      initialBudget: this.initialBudget,
      consumedBudget: this.consumedBudget,
      remainingBudget: remaining,
      stepCost: 0,
      totalSteps: this.stepCount,
      status: remaining <= 0 ? "exhausted" : "active"
    };
  }

  public canAfford(stepCost: number): boolean {
    return (this.initialBudget - this.consumedBudget) >= stepCost;
  }

  public recordStep(stepCost: number): PrivacyBudgetState {
    this.stepCount++;
    this.consumedBudget += stepCost;
    const remaining = this.initialBudget - this.consumedBudget;
    return {
      initialBudget: this.initialBudget,
      consumedBudget: this.consumedBudget,
      remainingBudget: Math.max(0, remaining),
      stepCost,
      totalSteps: this.stepCount,
      status: remaining <= 0 ? "exhausted" : "active"
    };
  }
}
