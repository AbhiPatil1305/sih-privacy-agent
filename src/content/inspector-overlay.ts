import { PrivacyRegion } from '../shared/types';

let overlayContainer: HTMLDivElement | null = null;

export function renderInspectorOverlay(regions: PrivacyRegion[], isEnabled: boolean) {
  if (!isEnabled) {
    if (overlayContainer) {
      overlayContainer.remove();
      overlayContainer = null;
    }
    return;
  }

  if (!overlayContainer) {
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'sih-privacy-inspector-overlay';
    overlayContainer.style.position = 'fixed';
    overlayContainer.style.top = '0';
    overlayContainer.style.left = '0';
    overlayContainer.style.width = '100vw';
    overlayContainer.style.height = '100vh';
    overlayContainer.style.pointerEvents = 'none';
    overlayContainer.style.zIndex = '2147483647';
    document.body.appendChild(overlayContainer);
  }

  overlayContainer.innerHTML = '';

  const dpr = window.devicePixelRatio || 1;

  regions.forEach((reg) => {
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.left = `${reg.bbox.x}px`;
    box.style.top = `${reg.bbox.y}px`;
    box.style.width = `${reg.bbox.width}px`;
    box.style.height = `${reg.bbox.height}px`;
    box.style.boxSizing = 'border-box';
    box.style.pointerEvents = 'auto';

    let strokeColor = '#22c55e'; // Green for DOM
    if (reg.source === 'vision') strokeColor = '#3b82f6'; // Blue for Vision DETR
    if (reg.source === 'ocr') strokeColor = '#ef4444'; // Red for OCR

    box.style.border = `2px dashed ${strokeColor}`;
    box.style.backgroundColor = reg.protection === 'BLACK' ? 'rgba(0,0,0,0.3)' : 'rgba(59,130,246,0.2)';
    box.style.borderRadius = '3px';

    const label = document.createElement('span');
    label.innerText = `${reg.category} (${reg.source.toUpperCase()})`;
    label.style.position = 'absolute';
    label.style.top = '-18px';
    label.style.left = '0';
    label.style.backgroundColor = strokeColor;
    label.style.color = '#ffffff';
    label.style.fontSize = '10px';
    label.style.fontWeight = 'bold';
    label.style.padding = '1px 5px';
    label.style.borderRadius = '3px';
    label.style.whiteSpace = 'nowrap';
    label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)';

    box.appendChild(label);
    overlayContainer?.appendChild(box);
  });
}
