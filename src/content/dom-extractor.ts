import { PageStructure, SafeElement } from '../shared/types';
import { globalRegistry } from './element-registry';
import './action-executor';

const INTERESTING_TAGS = ['INPUT', 'BUTTON', 'A', 'TEXTAREA', 'SELECT', 'LABEL', 'FORM', 'H1', 'H2', 'H3', 'P', 'SPAN', 'DIV'];

function isElementVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function extractPageStructure(): PageStructure {
  globalRegistry.clear();
  
  const elements: SafeElement[] = [];
  const allElements = document.querySelectorAll<HTMLElement>('*');

  allElements.forEach((el) => {
    if (!INTERESTING_TAGS.includes(el.tagName)) {
      if (el.tagName !== 'DIV' && el.tagName !== 'SPAN') return;
      if (!el.onclick && !el.textContent?.trim()) return;
    }

    if (!isElementVisible(el)) return;

    const rect = el.getBoundingClientRect();
    const id = globalRegistry.register(el);
    
    let type = undefined;
    if (el instanceof HTMLInputElement) {
      type = el.type; // E.g., 'email', 'password', 'text'
    }

    let role = el.getAttribute('role') || undefined;
    let label = el.getAttribute('aria-label') || el.getAttribute('placeholder') || undefined;
    
    // STRICT PRIVACY RULE: Never extract 'value' or user-typed text.
    const isInputNode = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    const isEditable = el.isContentEditable;
    
    if (!label && !isInputNode && !isEditable) {
       // Only grab text content if it's a static display element (e.g. Button, Span, Label)
       const text = el.innerText || el.textContent?.trim() || undefined;
       if (text) {
         label = text.length > 50 ? text.substring(0, 50) + '...' : text;
       }
    }

    const safeElement: SafeElement = {
      id,
      tag: el.tagName.toLowerCase(),
      bbox: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }
    };

    if (type) safeElement.type = type;
    if (role) safeElement.role = role;
    if (label) safeElement.label = label;

    elements.push(safeElement);
  });

  return {
    url: window.location.href, // Could sanitize query params here if needed
    title: document.title,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    },
    elements
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_DOM') {
    const structure = extractPageStructure();
    sendResponse({ success: true, data: structure });
  }
});
