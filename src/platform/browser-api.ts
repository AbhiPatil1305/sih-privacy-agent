/**
 * SIH 2026 Privacy Agent — Cross-Browser API Adapter
 *
 * Wraps browser extension APIs using globalThis.browser ?? globalThis.chrome
 * to provide seamless, unified execution across Chrome/Chromium and Firefox (Gecko).
 */

declare global {
  var browser: any;
}

// Universal browser global detection
const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
const nativeBrowser = g.browser || g.chrome || null;

export const browserAPI = {
  /**
   * Runtime APIs
   */
  runtime: {
    sendMessage: (message: any): Promise<any> => {
      if (!nativeBrowser || !nativeBrowser.runtime) {
        return Promise.reject(new Error('Extension runtime API unavailable in current environment.'));
      }
      if (typeof g.browser !== 'undefined' && nativeBrowser.runtime.sendMessage.length === 1) {
        return nativeBrowser.runtime.sendMessage(message);
      }
      return new Promise((resolve, reject) => {
        nativeBrowser.runtime.sendMessage(message, (response: any) => {
          const err = nativeBrowser.runtime.lastError;
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
    },

    onMessage: {
      addListener: (callback: (request: any, sender: any, sendResponse: (response?: any) => void) => boolean | void) => {
        if (nativeBrowser && nativeBrowser.runtime && nativeBrowser.runtime.onMessage) {
          nativeBrowser.runtime.onMessage.addListener(callback);
        }
      }
    },

    get lastError() {
      return nativeBrowser?.runtime?.lastError || null;
    }
  },

  /**
   * Tabs APIs
   */
  tabs: {
    query: (queryInfo: any): Promise<any[]> => {
      if (!nativeBrowser || !nativeBrowser.tabs) {
        return Promise.resolve([]);
      }
      if (typeof g.browser !== 'undefined') {
        return nativeBrowser.tabs.query(queryInfo);
      }
      return new Promise((resolve, reject) => {
        nativeBrowser.tabs.query(queryInfo, (tabs: any[]) => {
          const err = nativeBrowser.runtime?.lastError;
          if (err) reject(err);
          else resolve(tabs || []);
        });
      });
    },

    captureVisibleTab: (windowId?: number, options?: any): Promise<string> => {
      if (!nativeBrowser || !nativeBrowser.tabs || !nativeBrowser.tabs.captureVisibleTab) {
        return Promise.reject(new Error('chrome.tabs.captureVisibleTab unavailable.'));
      }
      const targetWindow = windowId ?? (nativeBrowser.windows?.WINDOW_ID_CURRENT || -2);
      const opts = options || { format: 'png' };

      if (typeof g.browser !== 'undefined') {
        return nativeBrowser.tabs.captureVisibleTab(targetWindow, opts);
      }
      return new Promise((resolve, reject) => {
        nativeBrowser.tabs.captureVisibleTab(targetWindow, opts, (dataUrl: string) => {
          const err = nativeBrowser.runtime?.lastError;
          if (err) reject(err);
          else resolve(dataUrl);
        });
      });
    }
  },

  /**
   * Scripting APIs
   */
  scripting: {
    executeScript: (injection: any): Promise<any[]> => {
      if (!nativeBrowser || !nativeBrowser.scripting) {
        return Promise.reject(new Error('chrome.scripting API unavailable.'));
      }
      if (typeof g.browser !== 'undefined') {
        return nativeBrowser.scripting.executeScript(injection);
      }
      return new Promise((resolve, reject) => {
        nativeBrowser.scripting.executeScript(injection, (results: any[]) => {
          const err = nativeBrowser.runtime?.lastError;
          if (err) reject(err);
          else resolve(results || []);
        });
      });
    }
  },

  /**
   * Windows Constants
   */
  windows: {
    WINDOW_ID_CURRENT: nativeBrowser?.windows?.WINDOW_ID_CURRENT || -2
  }
};

