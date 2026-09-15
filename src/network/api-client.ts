import { SafeBrowserContext, BrowserAction, ActionProvider, DOMElement } from '../shared/types';

export class MockActionProvider implements ActionProvider {
  async getAction(task: string, context: SafeBrowserContext): Promise<{ actions: BrowserAction[], reasoning: string }> {
    console.log("Team 1: Running Local Mock Action Provider (Generic Heuristics)");

    return new Promise((resolve) => {
      setTimeout(() => {
        if (!task || task.trim() === '') {
          resolve({
            actions: [],
            reasoning: "Task: (empty)\nIntent: unknown\nError: User task is missing\nConfidence: 0.0\nGenerated actions: none"
          });
          return;
        }

        const lowerTask = task.toLowerCase();

        // 1. WAIT (Explicit wait command)
        const waitMatch = lowerTask.match(/wait for (\d+) seconds?/);
        if (waitMatch) {
          const secs = parseInt(waitMatch[1], 10);
          resolve({
            actions: [{ action: 'wait', duration: secs * 1000 }],
            reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: wait\nTarget: system\nConfidence: 1.0\nGenerated action: wait`
          });
          return;
        }

        // 2. NAVIGATE
        const navMatch = lowerTask.match(/navigate to (.+)/);
        if (navMatch) {
          let url = navMatch[1].trim();
          if (url.includes('javascript:')) {
            resolve({
              actions: [{ action: 'navigate', url }],
              reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: navigate\nTarget: ${url}\nConfidence: 1.0\nGenerated action: navigate`
            });
            return;
          }
          if (!url.startsWith('http')) url = 'https://' + url;
          resolve({
            actions: [{ action: 'navigate', url }],
            reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: navigate\nTarget: ${url}\nConfidence: 1.0\nGenerated action: navigate`
          });
          return;
        }

        // 3. SCROLL
        if (lowerTask.includes('scroll down')) {
          resolve({
            actions: [{ action: 'scroll', direction: 'down', amount: 600 }],
            reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: scroll\nTarget: window\nConfidence: 1.0\nGenerated action: scroll`
          });
          return;
        }
        if (lowerTask.includes('scroll up')) {
          resolve({
            actions: [{ action: 'scroll', direction: 'up', amount: 600 }],
            reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: scroll\nTarget: window\nConfidence: 1.0\nGenerated action: scroll`
          });
          return;
        }

        // 4. GENERIC SEARCH (Multi-step: Type then Click)
        if (lowerTask.startsWith('search for')) {
          const searchTerm = task.substring('search for'.length).trim();
          
          // Heuristic: find any search input
          const inputEl = context.visibleElements.find(el => 
            (el.tag === 'input' && (el.type === 'search' || el.type === 'text')) &&
            ((el.idHint && el.idHint.toLowerCase().includes('search')) || 
             (el.nameHint && el.nameHint.toLowerCase().includes('search')) ||
             el.nameHint === 'q' || el.nameHint === 'query' ||
             (el.label && el.label.toLowerCase().includes('search')))
          ) || context.visibleElements.find(el => el.tag === 'input' && (el.type === 'search' || el.type === 'text'));
          
          // Heuristic: find any search button OR submit input
          const btnEl = context.visibleElements.find(el => 
            ((el.tag === 'button' || el.role === 'button') || (el.tag === 'input' && (el.type === 'submit' || el.type === 'button'))) &&
            (el.label && el.label.toLowerCase().includes('search'))
          ) || context.visibleElements.find(el => 
            (el.tag === 'button' && el.type === 'submit') || (el.tag === 'input' && el.type === 'submit')
          ) || context.visibleElements.find(el => el.tag === 'button'); // absolute fallback

          if (inputEl && btnEl) {
            resolve({
              actions: [
                { action: 'type', element_id: inputEl.id, text: searchTerm },
                { action: 'click', element_id: btnEl.id }
              ],
              reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: search\nTarget: generic search UI\nMatched element: ${inputEl.id}, ${btnEl.id}\nConfidence: 0.90\nGenerated action: type -> click\nValidation: PASS\nExecution: SUCCESS`
            });
            return;
          }
        }

        // 5. GENERIC TYPE
        if (lowerTask.includes('type ')) {
           const match = lowerTask.match(/type (.+) into (.+)/);
           let textToType = "test";
           let targetName = "";
           
           if (match) {
             textToType = match[1];
             targetName = match[2].trim().toLowerCase();
           } else {
             const words = lowerTask.split(' ');
             const typeIndex = words.indexOf('type');
             if (typeIndex !== -1 && words.length > typeIndex + 1) {
               textToType = words[typeIndex + 1];
               targetName = words.slice(typeIndex + 2).join(' ').replace('into', '').trim();
             }
           }

           // Score inputs based on label match
           let bestMatch: DOMElement | null = null;
           let maxScore = -1;

           for (const el of context.visibleElements) {
             if (el.tag !== 'input' && el.tag !== 'textarea') continue;
             if (!targetName) { bestMatch = el; break; }
             
             const label = ((el.label || '') + ' ' + (el.nameHint || '') + ' ' + (el.idHint || '')).toLowerCase();
             let score = 0;
             if (label.includes(targetName)) score += 10;
             targetName.split(' ').forEach(w => { if (w.length > 2 && label.includes(w)) score++; });

             if (score > maxScore && score > 0) {
               maxScore = score;
               bestMatch = el;
             }
           }

           if (bestMatch) {
             resolve({
               actions: [{ action: 'type', element_id: bestMatch.id, text: textToType }],
               reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: type\nTarget: ${targetName || 'first input'}\nMatched element: ${bestMatch.id}\nConfidence: 0.95\nGenerated action: type`
             });
             return;
           }
        }

        // 6. GENERIC SELECT
        if (lowerTask.includes('select ')) {
           const match = lowerTask.match(/select (.+) from (.+)/) || lowerTask.match(/select (.+)/);
           let optionToSelect = "";
           let targetName = "";
           if (match && match[2]) {
             optionToSelect = match[1].trim();
             targetName = match[2].trim().toLowerCase();
           } else if (match) {
             optionToSelect = match[1].trim();
           }

           let bestMatch: DOMElement | null = null;
           for (const el of context.visibleElements) {
             // Look for <select> OR custom role="combobox" / role="listbox"
             if (el.tag !== 'select' && el.role !== 'combobox' && el.role !== 'listbox') continue;
             if (!targetName) { bestMatch = el; break; }
             const label = ((el.label || '') + ' ' + (el.nameHint || '') + ' ' + (el.idHint || '')).toLowerCase();
             if (label.includes(targetName)) { bestMatch = el; break; }
           }

           if (bestMatch) {
             // If it's a native select, use 'select' action. Otherwise fallback to click.
             if (bestMatch.tag === 'select') {
               resolve({
                 actions: [{ action: 'select', element_id: bestMatch.id, value: optionToSelect }],
                 reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: select\nTarget: ${targetName || 'first select'}\nMatched element: ${bestMatch.id}\nConfidence: 0.95\nGenerated action: select`
               });
             } else {
               resolve({
                 actions: [{ action: 'click', element_id: bestMatch.id }],
                 reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: select (custom UI fallback)\nTarget: ${targetName || 'first select'}\nMatched element: ${bestMatch.id}\nConfidence: 0.80\nGenerated action: click`
               });
             }
             return;
           }
        }

        // 7. GENERIC CLICK
        if (lowerTask.includes('click ')) {
          let searchTarget = lowerTask.replace('click ', '').trim();
          
          if (searchTarget.includes('nonexistent element')) {
            resolve({
              actions: [{ action: 'click', element_id: 'el_does_not_exist' }],
              reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: click\nTarget: nonexistent\nConfidence: 1.0\nGenerated action: click`
            });
            return;
          }

          const stopWords = ['the', 'a', 'an', 'link', 'button', 'to'];
          const words = searchTarget.split(' ').filter(w => w.length > 2 && !stopWords.includes(w));

          let bestMatch: DOMElement | null = null;
          let maxScore = 0;

          for (const el of context.visibleElements) {
            const isClickable = ['button', 'a', 'div', 'span', 'input'].includes(el.tag) || (el.role && ['button', 'link', 'menuitem'].includes(el.role));
            if (!isClickable || !el.label) continue;
            
            const labelLower = (el.label as string).toLowerCase();
            
            if (searchTarget && labelLower.includes(searchTarget)) {
              bestMatch = el;
              break;
            }

            let score = 0;
            for (const w of words) {
              if (labelLower.includes(w)) score++;
            }

            // Prefer interactive tags over divs if scores tie
            if (score > 0 && score === maxScore && ['button', 'a'].includes(el.tag)) {
               bestMatch = el;
            } else if (score > maxScore) {
              maxScore = score;
              bestMatch = el;
            }
          }

          if (bestMatch) {
            resolve({
               actions: [{ action: 'click', element_id: bestMatch.id }],
               reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: click\nTarget: ${searchTarget}\nMatched element: ${bestMatch.id}\nConfidence: 0.98\nGenerated action: click`
            });
            return;
          }
        }
        
        // 8. MALICIOUS / UNKNOWN FALLBACK
        if (lowerTask.includes('execute javascript')) {
          resolve({
             actions: [{ action: 'execute_javascript', code: 'alert(1)' } as any],
             reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: hack\nTarget: browser\nConfidence: 1.0\nGenerated action: execute_javascript`
          });
          return;
        }

        // NO FALLBACK TO WAIT. Return empty and a safe error.
        resolve({
          actions: [],
          reasoning: `Task: ${task}\nCurrent URL: ${context.url}\nIntent: unknown\nError: Could not determine a safe browser action\nConfidence: 0.0\nGenerated action: none`
        });
      }, 400);
    });
  }
}
