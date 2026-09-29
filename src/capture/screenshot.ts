import { browserAPI } from '../platform/browser-api';

export async function captureVisibleTab(windowId?: number): Promise<string> {
  return browserAPI.tabs.captureVisibleTab(windowId);
}

