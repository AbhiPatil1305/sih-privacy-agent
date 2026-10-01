const fs = require('fs');
const path = require('path');
const OpenRouterProvider = require('../server/vlm/openrouter-provider');
const { SYSTEM_PROMPT } = require('../server/agent/prompts');
const { parseVLMOutput, validateActionPlan } = require('../server/agent/action-schema');

// Load environment variables if .env exists
try {
  require('dotenv').config();
} catch (_) {}

async function runSmokeTests() {
  console.log("==================================================");
  console.log("OPENROUTER PROVIDER SMOKE & VISION TEST SUITE");
  console.log("==================================================\n");

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.log("⚠️ OPENROUTER_API_KEY is not set in environment.");
    console.log("  To run OpenRouter live tests, set OPENROUTER_API_KEY in your .env file or environment.");
    console.log("  Skipping network calls.\n");
    return;
  }

  const model = process.env.VLM_MODEL || 'google/gemma-4-26b-a4b-it:free';
  const provider = new OpenRouterProvider({
    model,
    apiKey,
    timeoutMs: 60000
  });

  console.log(`[Config] Provider: ${provider.name}`);
  console.log(`[Config] Model: ${provider.model}`);
  console.log(`[Config] Base URL: ${provider.baseUrl}`);
  console.log(`[Security Check] API Key present: ${Boolean(provider.apiKey)} (Masked: ${provider.apiKey.substring(0, 4)}...${provider.apiKey.slice(-4)})\n`);

  // TEST 1: TEXT-ONLY SMOKE TEST
  console.log("--- TEST 1: Text-Only Deterministic JSON Smoke Test ---");
  try {
    const res1 = await provider.generatePlan({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: 'TASK: "Return valid JSON containing status=complete."'
    });

    console.log(`✅ Test 1 Success! Latency: ${res1.latencyMs}ms`);
    console.log(`   Raw Output Snippet: "${res1.rawOutput.substring(0, 80)}..."`);
    const parsed1 = parseVLMOutput(res1.rawOutput);
    console.log(`   Parsed Status: ${parsed1.status}\n`);
  } catch (err) {
    console.error(`❌ Test 1 Failed: ${err.message}\n`);
  }

  // TEST 2: REAL GUIGUARD VISION TEST
  console.log("--- TEST 2: Real Screenshot Vision Test (GUIGuard Bench 136) ---");
  const imgPath = path.join(__dirname, '../data/GUIGuard-Bench/PC/136/step_10_20251106@080732.png');

  if (!fs.existsSync(imgPath)) {
    console.log(`⚠️ Image fixture not found at ${imgPath}, skipping vision test.`);
    return;
  }

  const imgBuffer = fs.readFileSync(imgPath);
  const base64Image = `data:image/png;base64,${imgBuffer.toString('base64')}`;

  const visibleElements = [
    { id: 'el_001', tag: 'button', label: 'Finish', bbox: { x: 500, y: 400, width: 80, height: 30 } },
    { id: 'el_002', tag: 'button', label: 'Next >', bbox: { x: 410, y: 400, width: 80, height: 30 } },
    { id: 'el_003', tag: 'button', label: '< Back', bbox: { x: 320, y: 400, width: 80, height: 30 } },
    { id: 'el_004', tag: 'button', label: 'Cancel', bbox: { x: 230, y: 400, width: 80, height: 30 } }
  ];

  const userPromptText = `TASK: "Click the Finish button to complete the chart wizard."\n\nVISIBLE INTERACTIVE ELEMENTS:\n${JSON.stringify(visibleElements)}`;

  try {
    const res2 = await provider.generatePlan({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: userPromptText,
      sanitizedScreenshot: base64Image
    });

    console.log(`✅ Test 2 Vision Success! Total Latency: ${res2.latencyMs}ms`);
    console.log(`   Raw Output: ${res2.rawOutput}`);

    const parsed2 = parseVLMOutput(res2.rawOutput);
    const validated2 = validateActionPlan(parsed2, visibleElements);
    console.log("   Action Schema Validation: PASS ✅");
    console.log(`   Validated Action: ${validated2.actions[0]?.action} -> ${validated2.actions[0]?.element_id}\n`);
  } catch (err) {
    console.error(`❌ Test 2 Vision Failed: ${err.message}\n`);
  }
}

runSmokeTests().catch(console.error);
