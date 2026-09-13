export async function captureVisibleTab(windowId?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(
      windowId ?? chrome.windows.WINDOW_ID_CURRENT,
      { format: 'png' },
      (dataUrl) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(dataUrl);
      }
    );
  });
}
