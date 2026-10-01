const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const AgentPlanner = require('./agent/planner');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large base64 screenshots

// Initialize Agent Planner (VLM / Rule configurable via PLANNER_MODE env)
const planner = new AgentPlanner();

// Serve static demo test page
app.use(express.static(path.join(__dirname, '../public')));
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/test-page.html'));
});

app.post('/api/plan', async (req, res) => {
  console.log("\n==========================================");
  console.log("[API] POST /api/plan received request");

  const task = req.body.task;
  const context = req.body.context || {};
  const visibleElements = req.body.visibleElements || context.visibleElements || [];
  const sanitizedScreenshot = req.body.sanitizedScreenshot || context.sanitizedScreenshot;
  const sanitizedDOM = req.body.sanitizedDOM || context.sanitizedDOM;

  const step = req.body.stepNumber || req.body.step || context.step || 1;

  // 1. Validate Request Body
  if (!task || typeof task !== 'string' || !task.trim()) {
    console.log("[API] Request rejected: missing or invalid task.");
    return res.status(400).json({
      success: false,
      error: 'BAD_REQUEST',
      reasoning: 'Task requirement missing or invalid in request body.'
    });
  }

  // 2. Privacy-Respecting Development Logging (NO RAW PII OR PASSWORDS LOGGED)
  console.log(`[API] Task: "${task}" (Step ${step})`);
  console.log(`[API] Sanitized screenshot received: ${Boolean(sanitizedScreenshot)} ${sanitizedScreenshot ? `(${sanitizedScreenshot.length} chars base64)` : ''}`);
  console.log(`[API] Sanitized DOM received: ${Boolean(sanitizedDOM)}`);
  console.log(`[API] Visible elements count: ${visibleElements.length}`);

  // 3. Invoke Server-Side VLM Planner
  try {
    const planResult = await planner.planTask({
      task,
      step,
      sanitizedScreenshot,
      visibleElements,
      sanitizedDOM
    });

    return res.json({
      success: true,
      status: planResult.status || 'continue',
      actions: planResult.actions,
      reasoning: planResult.reasoning,
      metrics: planResult.metrics
    });

  } catch (error) {
    console.error(`[API] Error during planning: ${error.message} (Code: ${error.code || 'INTERNAL_ERROR'})`);

    const errorCode = error.code || 'INTERNAL_ERROR';

    if (errorCode === 'MODEL_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        error: 'MODEL_UNAVAILABLE',
        reasoning: error.message
      });
    }

    if (errorCode === 'MODEL_TIMEOUT') {
      return res.status(504).json({
        success: false,
        error: 'MODEL_TIMEOUT',
        reasoning: error.message
      });
    }

    if (errorCode === 'MODEL_INVALID_OUTPUT' || errorCode === 'INVALID_TARGET') {
      return res.status(422).json({
        success: false,
        error: errorCode,
        reasoning: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      reasoning: error.message || 'Server encountered an unexpected error.'
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🤖 SIH Agent Server (VLM Enabled) running on http://localhost:${PORT}`);
  console.log(`📄 Test page available at http://localhost:3000/test`);
});


