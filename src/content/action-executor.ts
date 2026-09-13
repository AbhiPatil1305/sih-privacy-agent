import { AgentAction } from '../shared/types';

export function executeAction(action: AgentAction): boolean {
  if (action.action === 'click') {
    const el = document.querySelector(`[data-agent-id="${action.element_id}"]`) as HTMLElement;
    if (el) { el.click(); return true; }
  }
  
  if (action.action === 'type') {
    const el = document.querySelector(`[data-agent-id="${action.element_id}"]`) as HTMLElement;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = action.text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }

  if (action.action === 'scroll') {
    const amount = action.direction === 'down' ? window.innerHeight / 1.5 : -window.innerHeight / 1.5;
    window.scrollBy({ top: amount, behavior: 'smooth' });
    if (document.scrollingElement) {
      document.scrollingElement.scrollBy({ top: amount, behavior: 'smooth' });
    }
    return true;
  }
  
  return false;
}
