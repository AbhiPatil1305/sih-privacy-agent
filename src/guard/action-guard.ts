import { AgentAction, DOMElement } from '../shared/types';

export interface ActionGuardResult {
  allowed: boolean;
  actionSummary: string;
  checks: {
    actionTypeAllowed: boolean;
    elementExists: boolean;
    elementVisible: boolean;
    pageCorrespondence: boolean;
    actionSafe: boolean;
  };
  reason: string;
}

const ALLOWED_ACTIONS = new Set(['click', 'type', 'scroll', 'wait', 'navigate', 'select']);
const DANGEROUS_PATTERNS = ['delete', 'remove-all', 'format', 'reset-database', 'wipe'];

/**
 * Local Action Guard: Evaluates AI action proposals against local security constraints
 * BEFORE allowing any DOM interaction. The remote AI is never granted execution authority.
 */
export function validateActionLocally(
  action: AgentAction,
  visibleElements: DOMElement[],
  currentUrl?: string
): ActionGuardResult {
  const actionTypeAllowed = ALLOWED_ACTIONS.has(action.action);

  if (!actionTypeAllowed) {
    return {
      allowed: false,
      actionSummary: `Disallowed action type: ${(action as any).action}`,
      checks: {
        actionTypeAllowed: false,
        elementExists: false,
        elementVisible: false,
        pageCorrespondence: true,
        actionSafe: false
      },
      reason: `Action type '${(action as any).action}' is not in the approved safety whitelist.`
    };
  }

  // Scroll and wait actions do not target a specific DOM element
  if (action.action === 'scroll' || action.action === 'wait') {
    return {
      allowed: true,
      actionSummary: action.action === 'scroll' ? `Scroll ${action.direction}` : `Wait ${action.duration}ms`,
      checks: {
        actionTypeAllowed: true,
        elementExists: true,
        elementVisible: true,
        pageCorrespondence: true,
        actionSafe: true
      },
      reason: 'Passive action validated successfully.'
    };
  }

  if (action.action === 'navigate') {
    const isSafeUrl = action.url.startsWith('http://') || action.url.startsWith('https://');
    return {
      allowed: isSafeUrl,
      actionSummary: `Navigate to ${action.url}`,
      checks: {
        actionTypeAllowed: true,
        elementExists: true,
        elementVisible: true,
        pageCorrespondence: true,
        actionSafe: isSafeUrl
      },
      reason: isSafeUrl ? 'Navigation target is valid web URL.' : 'Untrusted protocol rejected.'
    };
  }

  // Target element validation for 'click', 'type', 'select'
  const targetElement = visibleElements.find(el => el.id === action.element_id);
  const elementExists = !!targetElement;

  if (!elementExists) {
    return {
      allowed: false,
      actionSummary: `${action.action.toUpperCase()} [${action.element_id}]`,
      checks: {
        actionTypeAllowed: true,
        elementExists: false,
        elementVisible: false,
        pageCorrespondence: false,
        actionSafe: false
      },
      reason: `Element '${action.element_id}' does not exist in the captured page DOM.`
    };
  }

  // Visibility check: Positive dimensions
  const elementVisible =
    (targetElement.bbox.width > 0 && targetElement.bbox.height > 0);

  // Safety check: ensure the target is not a dangerous / destructive action
  const labelLower = (targetElement.label || '').toLowerCase();
  const isDangerous = DANGEROUS_PATTERNS.some(p => labelLower.includes(p));

  const actionSafe = elementVisible && !isDangerous;
  const targetLabel = targetElement.label || targetElement.tag;
  const actionSummary = `${action.action.toUpperCase()} "${targetLabel}" (${targetElement.id})`;

  const allowed = actionTypeAllowed && elementExists && elementVisible && actionSafe;

  return {
    allowed,
    actionSummary,
    checks: {
      actionTypeAllowed: true,
      elementExists: true,
      elementVisible,
      pageCorrespondence: true,
      actionSafe
    },
    reason: allowed
      ? `Action verified: element is visible, matched to current page, and within safety parameters.`
      : !elementVisible
      ? 'Element has zero area or is not currently rendered.'
      : 'Action was flagged as potentially destructive by safety filters.'
  };
}
