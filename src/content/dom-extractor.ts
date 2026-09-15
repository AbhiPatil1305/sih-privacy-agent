import { executeAction } from './action-executor';

// Existing DOM extraction stub or logic can stay here
export function extractDOM() { return "stub"; }

// Listen for action execution requests from the popup or background worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXECUTE_ACTION') {
    executeAction(request.action)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, action: request.action?.action, error: err.message }));
    return true; // Indicates asynchronous response
  }
});
