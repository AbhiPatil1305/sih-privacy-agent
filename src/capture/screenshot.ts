import { ScreenshotData } from '../shared/types';

export async function captureVisibleTab(): Promise<ScreenshotData> {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }

      // We need to get width and height. Since this might run in a service worker where DOM is not available,
      // we might just return the dataUrl and let the consumer or an offscreen document parse the dimensions,
      // OR we assume dimensions based on the current window.
      // For the prototype, we return the dataUrl and placeholder dimensions which can be updated later.
      resolve({
        image: dataUrl,
        width: 1920, // To be refined via window/tab query
        height: 1080,
        timestamp: Date.now()
      });
    });
  });
}
