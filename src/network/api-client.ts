import { SafeBrowserContext, AgentAction } from '../shared/types';

export async function fetchAgentPlan(task: string, context: SafeBrowserContext): Promise<{ actions: AgentAction[], reasoning: string }> {
  console.log("Team 1: Sending sanitized context to Server...");
  
  try {
    // Try to hit the real local server (Phase 11)
    const response = await fetch('http://localhost:3000/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, context })
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn("Real server at localhost:3000 not reachable. Falling back to local mock...", e);
  }

  // FALLBACK LOGIC
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerTask = task.toLowerCase();

      if (lowerTask.includes('scroll down')) {
        resolve({
          actions: [{ type: 'scroll', direction: 'down' }],
          reasoning: "Fallback: User explicitly requested to scroll down the page."
        });
        return;
      }

      if (lowerTask.includes('type')) {
        const words = lowerTask.split(' ');
        const typeIndex = words.indexOf('type');
        let textToType = "test value";
        if (typeIndex !== -1 && words.length > typeIndex + 1) textToType = words[typeIndex + 1];

        const inputField = context.visibleElements.find(el => el.tag === 'input' || el.tag === 'textarea');
        if (inputField) {
          resolve({
            actions: [{ type: 'type', target: { elementId: inputField.id }, text: textToType }],
            reasoning: `Fallback: Found an input field (ID: ${inputField.id}). Proceeding to type "${textToType}".`
          });
          return;
        }
      }

      if (lowerTask.includes('click')) {
        const words = lowerTask.split(' ');
        let targetButton = context.visibleElements.find(el => 
          (el.tag === 'button' || el.role === 'button' || el.tag === 'a') &&
          el.label && words.some(w => el.label!.toLowerCase().includes(w) && w.length > 3)
        );

        if (!targetButton) targetButton = context.visibleElements.find(el => el.tag === 'button' || el.tag === 'a' || el.role === 'button');

        if (targetButton) {
          resolve({
            actions: [{ type: 'click', target: { elementId: targetButton.id } }],
            reasoning: `Fallback: Matched intent to click. Target element selected: ${targetButton.label || targetButton.tag} (ID: ${targetButton.id}).`
          });
          return;
        }
      }
      
      resolve({
        actions: [{ type: 'wait', duration: 1000 }],
        reasoning: "Fallback: Could not map the natural language task to a visible element or action. Waiting."
      });
    }, 800);
  });
}
