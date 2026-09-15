import { BrowserAction, ActionResult, ValidationResult, ClickAction, TypeAction, ScrollAction, SelectAction, WaitAction, NavigateAction } from '../shared/types';

// ==========================================
// VALIDATORS
// ==========================================

export function validateAction(action: any): ValidationResult {
  // 1. Schema Validation
  if (!action || typeof action !== 'object' || !action.action) {
    return { valid: false, error: 'Malformed action payload' };
  }

  // 2. Action Type Validation
  const allowedActions = ['click', 'type', 'scroll', 'select', 'wait', 'navigate'];
  if (!allowedActions.includes(action.action)) {
    return { valid: false, error: 'Unsupported action type' };
  }

  // 3. Action-specific validation
  if (action.action === 'click') {
    if (!action.element_id) return { valid: false, error: 'Missing element_id for click' };
    return validateElement(action.element_id, ['click']);
  }
  
  if (action.action === 'type') {
    if (!action.element_id) return { valid: false, error: 'Missing element_id for type' };
    if (typeof action.text !== 'string') return { valid: false, error: 'Missing or invalid text for type' };
    return validateElement(action.element_id, ['type']);
  }
  
  if (action.action === 'select') {
    if (!action.element_id) return { valid: false, error: 'Missing element_id for select' };
    if (typeof action.value !== 'string') return { valid: false, error: 'Missing or invalid value for select' };
    return validateElement(action.element_id, ['select']);
  }
  
  if (action.action === 'scroll') {
    if (action.direction !== 'up' && action.direction !== 'down') return { valid: false, error: 'Invalid scroll direction' };
    if (action.amount !== undefined && (typeof action.amount !== 'number' || action.amount <= 0)) {
       return { valid: false, error: 'Invalid scroll amount' };
    }
  }
  
  if (action.action === 'wait') {
    if (typeof action.duration !== 'number' || action.duration < 0 || !isFinite(action.duration) || isNaN(action.duration)) {
      return { valid: false, error: 'Invalid wait duration' };
    }
    if (action.duration > 30000) return { valid: false, error: 'Wait duration exceeds maximum allowed' };
  }
  
  if (action.action === 'navigate') {
    if (!action.url || typeof action.url !== 'string') return { valid: false, error: 'Missing URL' };
    try {
      const url = new URL(action.url);
      if (url.protocol === 'javascript:' || url.protocol === 'data:' || url.protocol === 'vbscript:') {
        return { valid: false, error: 'Unsafe or invalid URL' };
      }
    } catch {
      return { valid: false, error: 'Unsafe or invalid URL' };
    }
  }

  return { valid: true };
}

function validateElement(elementId: string, requiredCapabilities: string[]): ValidationResult {
  const el = document.querySelector(`[data-agent-id="${elementId}"]`) as HTMLElement;
  if (!el) {
    return { valid: false, error: 'Element not found' };
  }

  // Check visibility
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return { valid: false, error: 'Element is not visible' };
  }
  
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return { valid: false, error: 'Element is not visible' };
  }
  
  // Check interactability
  if ((el as any).disabled) {
    return { valid: false, error: 'Element is not interactable' };
  }

  if (requiredCapabilities.includes('type')) {
    const isInput = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    const isEditable = el.isContentEditable;
    if (!isInput && !isEditable) {
      return { valid: false, error: 'Element is not interactable' };
    }
    if ((el as HTMLInputElement).readOnly) {
       return { valid: false, error: 'Element is not interactable' };
    }
  }

  if (requiredCapabilities.includes('select')) {
    if (!(el instanceof HTMLSelectElement)) {
      return { valid: false, error: 'Element is not interactable' };
    }
  }

  return { valid: true };
}

// ==========================================
// EXECUTORS
// ==========================================

async function executeClick(action: ClickAction): Promise<ActionResult> {
  const el = document.querySelector(`[data-agent-id="${action.element_id}"]`) as HTMLElement;
  el.click();
  return { success: true, action: 'click', element_id: action.element_id, timestamp: Date.now() };
}

async function executeType(action: TypeAction): Promise<ActionResult> {
  const el = document.querySelector(`[data-agent-id="${action.element_id}"]`) as HTMLElement;
  
  let isPassword = false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.type === 'password') isPassword = true;
    el.value = action.text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (el.isContentEditable) {
    el.innerText = action.text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Do NOT log the actual text when the target is a password
  const loggedAction = { ...action };
  if (isPassword) {
    loggedAction.text = '[REDACTED_PASSWORD]';
  }
  
  return { success: true, action: 'type', element_id: action.element_id, timestamp: Date.now() };
}

async function executeScroll(action: ScrollAction): Promise<ActionResult> {
  const amount = action.amount && action.amount > 0 ? Math.min(action.amount, 5000) : window.innerHeight / 1.5;
  const scrollAmount = action.direction === 'down' ? amount : -amount;
  
  window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  if (document.scrollingElement) {
    document.scrollingElement.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  }
  
  return { success: true, action: 'scroll', timestamp: Date.now() };
}

async function executeSelect(action: SelectAction): Promise<ActionResult> {
  const el = document.querySelector(`[data-agent-id="${action.element_id}"]`) as HTMLSelectElement;
  
  // Verify option exists
  let optionFound = false;
  for (let i = 0; i < el.options.length; i++) {
    if (el.options[i].value === action.value || el.options[i].text === action.value) {
      el.selectedIndex = i;
      optionFound = true;
      break;
    }
  }
  
  if (!optionFound) {
    return { success: false, action: 'select', element_id: action.element_id, error: `Option "${action.value}" not found`, timestamp: Date.now() };
  }
  
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return { success: true, action: 'select', element_id: action.element_id, timestamp: Date.now() };
}

async function executeWait(action: WaitAction): Promise<ActionResult> {
  await new Promise(r => setTimeout(r, action.duration));
  return { success: true, action: 'wait', timestamp: Date.now() };
}

async function executeNavigate(action: NavigateAction): Promise<ActionResult> {
  window.location.href = action.url;
  return { success: true, action: 'navigate', timestamp: Date.now() };
}

// ==========================================
// CENTRAL ROUTER
// ==========================================

export async function executeAction(action: any): Promise<ActionResult> {
  try {
    const val = validateAction(action);
    if (!val.valid) {
      return {
        success: false,
        action: action?.action || 'unknown',
        element_id: action?.element_id,
        error: `Rejected: ${val.error}`,
        timestamp: Date.now()
      };
    }

    const browserAction = action as BrowserAction;
    switch (browserAction.action) {
      case 'click': return await executeClick(browserAction);
      case 'type': return await executeType(browserAction);
      case 'scroll': return await executeScroll(browserAction);
      case 'select': return await executeSelect(browserAction);
      case 'wait': return await executeWait(browserAction);
      case 'navigate': return await executeNavigate(browserAction);
      default: return { success: false, action: 'unknown', error: 'Rejected: Unsupported action', timestamp: Date.now() };
    }
  } catch (e: any) {
    return { success: false, action: action?.action || 'unknown', element_id: action?.element_id, error: e.message, timestamp: Date.now() };
  }
}
