import { SafeBrowserContext, AgentAction } from '../shared/types';

export async function fetchAgentPlan(task: string, context: SafeBrowserContext): Promise<{ actions: AgentAction[], reasoning: string }> {
  console.log("Team 1: Running Local Mock AI Agent (No external server used)");

  // 100% LOCAL MOCK LOGIC (No backend required for Team 1 Demo)
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerTask = task.toLowerCase();

      if (lowerTask.includes('scroll down')) {
        resolve({
          actions: [{ type: 'scroll', direction: 'down' }],
          reasoning: "Local Mock: User explicitly requested to scroll down the page."
        });
        return;
      }

      if (lowerTask.includes('scroll up')) {
        resolve({
          actions: [{ type: 'scroll', direction: 'up' }],
          reasoning: "Local Mock: User explicitly requested to scroll up the page."
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
            reasoning: `Local Mock: Found an input field (ID: ${inputField.id}). Proceeding to type "${textToType}".`
          });
          return;
        }
      }

      if (lowerTask.includes('click')) {
        const searchTarget = lowerTask.replace('click', '').trim();
        const words = searchTarget.split(' ').filter(w => w.length > 2);

        let btn = context.visibleElements.find(el => {
          const isClickable = ['button', 'a', 'div', 'span'].includes(el.tag) || ['button', 'link', 'menuitem'].includes(el.role);
          if (!isClickable || !el.label) return false;
          
          const labelLower = el.label.toLowerCase();
          if (searchTarget && labelLower.includes(searchTarget)) return true;
          return words.some(w => labelLower.includes(w));
        });

        if (btn) {
          resolve({
             actions: [{ type: 'click', target: { elementId: btn.id } }],
             reasoning: `Local Mock: Located element "${btn.label}" (ID: ${btn.id}) and scheduled a click.`
          });
          return;
        }
      }
      
      resolve({
        actions: [{ type: 'wait', duration: 1000 }],
        reasoning: "Local Mock: Could not map the natural language task to a visible element or action. Waiting."
      });
    }, 800);
  });
}
