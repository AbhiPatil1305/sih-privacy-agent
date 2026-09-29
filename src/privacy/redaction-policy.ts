import { PrivacyRegion, PrivacyBudgetState } from '../shared/types';

export type SemanticProtectionLevel = 'STRICT' | 'MODERATE' | 'MINIMAL';
export type ProtectionStrategy = 'BLACK' | 'BLUR' | 'PRESERVE';
export type BudgetMode = 'NORMAL' | 'AGGRESSIVE' | 'STRICT';

export interface PolicyContext {
  remainingBudget?: number;
  initialBudget?: number;
  regionCount?: number;
  pageContext?: {
    title?: string;
    url?: string;
  };
}

export interface RedactionDecision {
  regionId: string;
  category: string;
  source: string;
  strategy: ProtectionStrategy;
  level: SemanticProtectionLevel;
  reason: string;
}

export interface RedactionPolicySummary {
  budgetRatio: number;
  budgetMode: BudgetMode;
  counts: {
    strict: number;
    moderate: number;
    minimal: number;
    black: number;
    blur: number;
    preserve: number;
  };
  upgradedCount: number;
  decisions: RedactionDecision[];
}

/**
 * High-Risk Categories that MUST ALWAYS use STRICT / BLACK protection.
 * Hard safety invariant: High-risk PII must NEVER be downgraded.
 */
const HIGH_RISK_CATEGORIES = new Set([
  'PASSWORD',
  'CREDIT_CARD',
  'SSN',
  'EMAIL',
  'PHONE'
]);

/**
 * Visual categories that default to MODERATE / BLUR under normal conditions
 */
const MODERATE_VISUAL_CATEGORIES = new Set([
  'FACE',
  'PERSON',
  'AVATAR'
]);

/**
 * Budget ratio thresholds (engineering policy thresholds)
 */
export const BUDGET_THRESHOLDS = {
  AGGRESSIVE_RATIO: 0.50, // Below 50% budget remaining triggers AGGRESSIVE mode
  STRICT_RATIO: 0.20      // Below 20% budget remaining triggers STRICT mode
};

/**
 * Evaluates the budget mode based on remaining / initial budget.
 */
export function getBudgetMode(remaining?: number, initial?: number): BudgetMode {
  if (remaining === undefined || initial === undefined || initial <= 0) {
    return 'NORMAL';
  }
  const ratio = remaining / initial;
  if (ratio < BUDGET_THRESHOLDS.STRICT_RATIO) {
    return 'STRICT';
  }
  if (ratio < BUDGET_THRESHOLDS.AGGRESSIVE_RATIO) {
    return 'AGGRESSIVE';
  }
  return 'NORMAL';
}

/**
 * Evaluates a single region to select its deterministic redaction strategy.
 */
export function selectRedactionStrategy(
  region: PrivacyRegion,
  budgetMode: BudgetMode = 'NORMAL'
): RedactionDecision {
  const cat = region.category.toUpperCase();

  // HARD INVARIANT 1: High-risk PII must ALWAYS be BLACK / STRICT
  if (HIGH_RISK_CATEGORIES.has(cat)) {
    return {
      regionId: region.id,
      category: cat,
      source: region.source,
      strategy: 'BLACK',
      level: 'STRICT',
      reason: 'HIGH_RISK_SAFETY_INVARIANT'
    };
  }

  // Visual categories (FACE, PERSON, AVATAR)
  if (MODERATE_VISUAL_CATEGORIES.has(cat)) {
    if (budgetMode === 'AGGRESSIVE' || budgetMode === 'STRICT') {
      return {
        regionId: region.id,
        category: cat,
        source: region.source,
        strategy: 'BLACK',
        level: 'STRICT',
        reason: `LOW_BUDGET_UPGRADE_${budgetMode}`
      };
    }
    return {
      regionId: region.id,
      category: cat,
      source: region.source,
      strategy: 'BLUR',
      level: 'MODERATE',
      reason: 'DEFAULT_VISUAL_MODERATE'
    };
  }

  // Critical budget mode upgrades all other sensitive regions to STRICT / BLACK
  if (budgetMode === 'STRICT') {
    return {
      regionId: region.id,
      category: cat,
      source: region.source,
      strategy: 'BLACK',
      level: 'STRICT',
      reason: 'CRITICAL_BUDGET_MAXIMUM_PROTECTION'
    };
  }

  // Default fallthrough for all other categories (VISUAL_PII, OTHER_SENSITIVE, OTHER)
  return {
    regionId: region.id,
    category: cat,
    source: region.source,
    strategy: 'BLACK',
    level: 'STRICT',
    reason: 'DEFAULT_CATEGORY_POLICY'
  };
}

/**
 * Applies the central redaction policy to an array of PrivacyRegion items.
 * Returns updated regions with final .protection assigned and a client-side summary.
 */
export function applyRedactionPolicy(
  regions: PrivacyRegion[],
  budgetState?: PrivacyBudgetState | null,
  pageContext?: PolicyContext
): { updatedRegions: PrivacyRegion[]; summary: RedactionPolicySummary } {
  const remaining = budgetState?.remainingBudget ?? pageContext?.remainingBudget;
  const initial = budgetState?.initialBudget ?? pageContext?.initialBudget;
  const budgetRatio = (remaining !== undefined && initial !== undefined && initial > 0)
    ? remaining / initial
    : 1.0;

  const budgetMode = getBudgetMode(remaining, initial);

  const decisions: RedactionDecision[] = [];
  const counts = {
    strict: 0,
    moderate: 0,
    minimal: 0,
    black: 0,
    blur: 0,
    preserve: 0
  };
  let upgradedCount = 0;

  const updatedRegions: PrivacyRegion[] = regions.map(region => {
    const decision = selectRedactionStrategy(region, budgetMode);
    decisions.push(decision);

    if (decision.level === 'STRICT') counts.strict++;
    else if (decision.level === 'MODERATE') counts.moderate++;
    else counts.minimal++;

    if (decision.strategy === 'BLACK') counts.black++;
    else if (decision.strategy === 'BLUR') counts.blur++;
    else counts.preserve++;

    if (decision.reason.startsWith('LOW_BUDGET_UPGRADE') || decision.reason.startsWith('CRITICAL_BUDGET')) {
      upgradedCount++;
    }

    // Safe client-side telemetry per region (NO RAW PII VALUES LOGGED)
    console.log(
      `[REDACTION_POLICY] id=${decision.regionId} category=${decision.category} source=${decision.source} strategy=${decision.strategy} level=${decision.level} reason=${decision.reason}`
    );

    return {
      ...region,
      protection: decision.strategy
    };
  });

  const summary: RedactionPolicySummary = {
    budgetRatio,
    budgetMode,
    counts,
    upgradedCount,
    decisions
  };

  // Safe summary telemetry
  console.log(
    `[REDACTION_POLICY_SUMMARY] mode=${budgetMode} remainingRatio=${(budgetRatio * 100).toFixed(0)}% strict=${counts.strict} moderate=${counts.moderate} minimal=${counts.minimal} black=${counts.black} blur=${counts.blur} preserve=${counts.preserve} upgraded=${upgradedCount}`
  );

  return { updatedRegions, summary };
}
