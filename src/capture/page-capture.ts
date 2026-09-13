import { PageCapture } from '../shared/types';

export async function capturePage(tabId: number): Promise<PageCapture> {
  // 1. Capture Screenshot via Background
  const screenshotResp = await chrome.runtime.sendMessage({ action: 'CAPTURE_SCREENSHOT' });
  if (!screenshotResp.success) throw new Error("Failed to capture screenshot");
  
  // 2. Extract DOM
  // Since we use Scripting API, we inject the function
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
      // Inlined exact logic from App.tsx DOM Extractor to keep it decoupled
      const INTERESTING_TAGS = ['INPUT', 'BUTTON', 'A', 'TEXTAREA', 'SELECT', 'LABEL', 'FORM', 'H1', 'H2', 'H3', 'P', 'SPAN', 'DIV'];
      
      function isElementVisible(el: HTMLElement): boolean {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      let counter = 1;
      const elements: any[] = [];
      const seenBoxes = new Set<string>();
      
      const allElements = Array.from(document.querySelectorAll<HTMLElement>('*'));

      for (let i = allElements.length - 1; i >= 0; i--) {
        const el = allElements[i];

        if (!INTERESTING_TAGS.includes(el.tagName)) {
          if (el.tagName !== 'DIV' && el.tagName !== 'SPAN') continue;
          if (!el.onclick && !el.textContent?.trim()) continue;
        }

        if (!isElementVisible(el)) continue;

        const rect = el.getBoundingClientRect();
        const bboxKey = `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)},${Math.round(rect.height)}`;
        if (seenBoxes.has(bboxKey)) continue;
        seenBoxes.add(bboxKey);

        const id = `el_${String(counter++).padStart(3, '0')}`;
        el.setAttribute('data-agent-id', id);
        
        let type = undefined;
        if (el instanceof HTMLInputElement) type = el.type; 

        let role = el.getAttribute('role') || undefined;
        let label = el.getAttribute('aria-label') || el.getAttribute('placeholder') || undefined;
        
        const isInputNode = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
        const isEditable = el.isContentEditable;
        
        if (!label && !isInputNode && !isEditable) {
           const text = el.innerText || el.textContent?.trim() || undefined;
           if (text) label = text.length > 50 ? text.substring(0, 50) + '...' : text;
        }

        const safeElement: any = {
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
      }
      elements.reverse();
      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1
        },
        elements
      };
    }
  });

  if (!results || !results[0] || !results[0].result) {
    throw new Error("Failed to extract DOM");
  }

  const domData = results[0].result as any;

  return {
    screenshot: screenshotResp.data.image,
    viewport: domData.viewport,
    elements: domData.elements
  };
}
