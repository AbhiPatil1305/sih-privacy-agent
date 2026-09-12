import { AgentAction } from '../shared/types';
import { globalRegistry } from './element-registry';

function validateElement(id: string): HTMLElement | null {
  const el = globalRegistry.getElement(id);
  if (!el) {
    console.error(`Validation failed: Element ${id} not found in registry.`);
    return null;
  }
  
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.error(`Validation failed: Element ${id} is not visible.`);
    return null;
  }
  
  if ((el as HTMLButtonElement).disabled) {
    console.error(`Validation failed: Element ${id} is disabled.`);
    return null;
  }
  
  return el;
}

export async function executeAction(action: AgentAction): Promise<boolean> {
  console.log("Executing action:", action);

  if (action.type === 'click') {
    const el = validateElement(action.target.elementId);
    if (!el) return false;
    el.click();
    return true;
  }
  
  if (action.type === 'type') {
    const el = validateElement(action.target.elementId);
    if (!el || !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false;
    el.value = action.text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  
  if (action.type === 'scroll') {
    window.scrollBy({
      top: action.direction === 'down' ? window.innerHeight / 2 : -window.innerHeight / 2,
      behavior: 'smooth'
    });
    return true;
  }

  return false;
}

// Listen for execution commands
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXECUTE_AGENT_ACTION') {
    executeAction(request.payload).then(success => sendResponse({ success }));
    return true;
  }
});
