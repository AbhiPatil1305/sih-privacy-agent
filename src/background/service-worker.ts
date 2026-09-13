import { captureVisibleTab } from '../capture/screenshot';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CAPTURE_SCREENSHOT') {
    captureVisibleTab()
      .then(data => sendResponse({ success: true, data: { image: data } }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async
  }
});
