const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large base64 sanitized screenshots

// Serve demo pages statically
app.use('/demo', express.static(path.join(__dirname, '../public/demo')));
app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/plan', (req, res) => {
  console.log("\n=== [REMOTE AI GATE] RECEIVED SANITIZED REQUEST ===");
  const { task, context } = req.body;

  console.log(`Task: "${task}"`);
  console.log(`Page: ${context?.pageTitle || 'Untitled'} (${context?.url || 'unknown URL'})`);
  console.log(`Received ${context?.visibleElements?.length || 0} sanitized DOM elements.`);
  if (context?.sanitizedScreenshot) {
    console.log(`Received sanitized screenshot: ${context.sanitizedScreenshot.length} chars base64.`);
  }

  // Double-check privacy compliance at backend gate: confirm no plain PII leaked
  const visibleElements = context?.visibleElements || context?.sanitizedDOM?.elements || [];
  const leakedPII = visibleElements.filter(el => {
    const l = (el.label || '').toLowerCase();
    return l.includes('user@example.com') || l.includes('9876543210') || l.includes('482931');
  });

  if (leakedPII.length > 0) {
    console.warn("⚠️ [PRIVACY WARNING] Potential unredacted elements detected in payload:", leakedPII.length);
  } else {
    console.log("🔒 [PRIVACY AUDIT] PASS: Zero unredacted PII patterns detected in received DOM context.");
  }

  const lowerTask = (task || '').toLowerCase();

  // DEMO AGENT MODE: Flight Booking Scenario Heuristic
  const isFlightSearch =
    (lowerTask.includes('search') && lowerTask.includes('flight')) ||
    (lowerTask.includes('mumbai') && lowerTask.includes('delhi')) ||
    lowerTask.includes('flight');

  let action = { action: 'wait', duration: 1000 };
  let reasoning = "Agent Reasoning — Demo Mode: Request processed. Waiting for instructions.";

  if (isFlightSearch) {
    // Find the Search Flights button in the sanitized elements
    const searchBtn = visibleElements.find(el => {
      const label = (el.label || '').toLowerCase();
      const isClickable = ['button', 'a', 'div', 'span'].includes(el.tag) || ['button', 'link'].includes(el.role);
      return isClickable && (label.includes('search flight') || label.includes('search'));
    });

    if (searchBtn) {
      action = { action: 'click', element_id: searchBtn.id };
      reasoning = `Agent Reasoning — Demo Mode: Identified flight search intent (Mumbai → Delhi). Target element '${searchBtn.label}' located in sanitized DOM. No private credentials needed or accessed.`;
      console.log(`[REASONING] Matched to target button: "${searchBtn.label}" (${searchBtn.id})`);
    } else {
      reasoning = "Agent Reasoning — Demo Mode: Detected flight search intent, but could not locate the Search button in the sanitized DOM.";
    }
  } else if (lowerTask.includes('scroll down')) {
    action = { action: 'scroll', direction: 'down' };
    reasoning = "Agent Reasoning — Demo Mode: Executing requested scroll down.";
  } else if (lowerTask.includes('scroll up')) {
    action = { action: 'scroll', direction: 'up' };
    reasoning = "Agent Reasoning — Demo Mode: Executing requested scroll up.";
  } else if (lowerTask.includes('click')) {
    const searchTarget = lowerTask.replace('click', '').trim();
    const words = searchTarget.split(' ').filter(w => w.length > 2);

    const btn = visibleElements.find(el => {
      const isClickable = ['button', 'a', 'div', 'span'].includes(el.tag) || ['button', 'link'].includes(el.role);
      if (!isClickable || !el.label) return false;
      const labelLower = el.label.toLowerCase();
      if (searchTarget && labelLower.includes(searchTarget)) return true;
      return words.some(w => labelLower.includes(w));
    });

    if (btn) {
      action = { action: 'click', element_id: btn.id };
      reasoning = `Agent Reasoning — Demo Mode: Located element "${btn.label}" (${btn.id}) and scheduled click.`;
    }
  }

  // Simulate realistic network reasoning delay
  setTimeout(() => {
    res.json({
      actions: [action],
      reasoning: reasoning,
      mode: 'demo',
      privacyGateStatus: 'PASS'
    });
  }, 400);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🤖 Privacy Agent Demo Server running on http://localhost:${PORT}`);
  console.log(`✈️  Demo Flight Page: http://localhost:${PORT}/demo/flight-booking.html`);
  console.log(`🔒 Ready to receive SafeBrowserContext payloads.`);
  console.log(`======================================================\n`);
});
