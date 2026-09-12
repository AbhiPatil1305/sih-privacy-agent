import { SafeBrowserContext, AgentAction } from '../shared/types';

export async function fetchAgentPlan(task: string, context: SafeBrowserContext): Promise<{ actions: AgentAction[], reasoning: string }> {
  console.log("Mock API received task:", task);
  console.log("Safe Context:", context);

  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerTask = task.toLowerCase();

      // 1. SCROLL COMMAND
      if (lowerTask.includes('scroll down')) {
        resolve({
          actions: [{ type: 'scroll', direction: 'down' }],
          reasoning: "User explicitly requested to scroll down the page."
        });
        return;
      }

      if (lowerTask.includes('scroll up')) {
        resolve({
          actions: [{ type: 'scroll', direction: 'up' }],
          reasoning: "User explicitly requested to scroll up the page."
        });
        return;
      }

      // 2. TYPE COMMAND (e.g., "type hello")
      if (lowerTask.includes('type')) {
        // Just extract the word after 'type'
        const words = lowerTask.split(' ');
        const typeIndex = words.indexOf('type');
        let textToType = "test value";
        if (typeIndex !== -1 && words.length > typeIndex + 1) {
          textToType = words[typeIndex + 1];
        }

        // Find the first input field
        const inputField = context.visibleElements.find(el => el.tag === 'input' || el.tag === 'textarea');
        if (inputField) {
          resolve({
            actions: [{ type: 'type', target: { elementId: inputField.id }, text: textToType }],
            reasoning: `Found an input field (ID: ${inputField.id}). Proceeding to type "${textToType}".`
          });
          return;
        }
      }

      // 3. CLICK COMMAND
      if (lowerTask.includes('click')) {
        // Try to find an element whose label roughly matches a word in the task
        const words = lowerTask.split(' ');
        let targetButton = context.visibleElements.find(el => 
          (el.tag === 'button' || el.role === 'button' || el.tag === 'a') &&
          el.label && words.some(w => el.label!.toLowerCase().includes(w) && w.length > 3)
        );

        // Fallback to ANY button or link
        if (!targetButton) {
           targetButton = context.visibleElements.find(el => el.tag === 'button' || el.tag === 'a' || el.role === 'button');
        }

        if (targetButton) {
          resolve({
            actions: [{ type: 'click', target: { elementId: targetButton.id } }],
            reasoning: `Matched intent to click. Target element selected: ${targetButton.label || targetButton.tag} (ID: ${targetButton.id}).`
          });
          return;
        }
      }
      
      // FALLBACK
      resolve({
        actions: [{ type: 'wait', duration: 1000 }],
        reasoning: "Could not map the natural language task to a visible element or action. Waiting."
      });
    }, 800); // 800ms mock delay to simulate network/AI processing
  });
}
