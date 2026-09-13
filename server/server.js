const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large base64 screenshots

app.post('/api/plan', (req, res) => {
  console.log("=== RECEIVED REQUEST FROM EXTENSION ===");
  const { task, context } = req.body;
  
  console.log(`Task: "${task}"`);
  console.log(`Received ${context.visibleElements.length} safe DOM elements.`);
  if (context.sanitizedScreenshot) {
    console.log(`Received sanitized screenshot (${context.sanitizedScreenshot.length} bytes).`);
  }

  const lowerTask = task.toLowerCase();
  let action = { type: 'wait', duration: 1000 };
  let reasoning = "Server processed request but didn't match a specific heuristic.";

  if (lowerTask.includes('scroll down')) {
    action = { type: 'scroll', direction: 'down' };
    reasoning = "Server interpreted user intent to scroll down.";
  } else if (lowerTask.includes('scroll up')) {
    action = { type: 'scroll', direction: 'up' };
    reasoning = "Server interpreted user intent to scroll up.";
  } else if (lowerTask.includes('click')) {
    // FIX: Actually try to match the text the user typed!
    const searchTarget = lowerTask.replace('click', '').trim();
    const words = searchTarget.split(' ').filter(w => w.length > 2); // Ignore small words like 'the'

    let btn = context.visibleElements.find(el => {
      // Must be a clickable type
      const isClickable = ['button', 'a', 'div', 'span'].includes(el.tag) || ['button', 'link', 'menuitem'].includes(el.role);
      if (!isClickable || !el.label) return false;
      
      const labelLower = el.label.toLowerCase();
      
      // If the user typed an exact match or substring
      if (searchTarget && labelLower.includes(searchTarget)) return true;
      
      // If any of the words match
      return words.some(w => labelLower.includes(w));
    });

    if (btn) {
      action = { type: 'click', target: { elementId: btn.id } };
      reasoning = `Server located element "${btn.label}" (ID: ${btn.id}) and scheduled a click.`;
      console.log(`[DECISION] matched task "${task}" to element ->`, btn.label);
    } else {
      console.log(`[DECISION] could not find any button matching "${task}"`);
    }
  }

  // Simulate network/AI delay
  setTimeout(() => {
    res.json({
      actions: [action],
      reasoning: reasoning
    });
  }, 500);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🤖 SIH Agent Server running on http://localhost:${PORT}`);
  console.log('Ready to receive sanitized payloads from the Chrome Extension.');
});
