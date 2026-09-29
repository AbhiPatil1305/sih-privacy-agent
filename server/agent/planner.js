/**
 * Server-Side Agent Planner Orchestrator
 */
const { createVLMProvider } = require('../vlm');
const { SYSTEM_PROMPT, buildUserPrompt } = require('./prompts');
const { parseVLMOutput, validateActionPlan } = require('./action-schema');

class AgentPlanner {
  constructor(config = {}) {
    this.mode = config.mode || process.env.PLANNER_MODE || 'vlm';
    this.vlmProvider = createVLMProvider(config.vlmConfig || {});
  }

  /**
   * Plans agent action from sanitized context
   * @param {Object} params
   * @param {string} params.task
   * @param {string} params.sanitizedScreenshot
   * @param {Array} params.visibleElements
   * @param {Object} params.sanitizedDOM
   * @returns {Promise<{ success: boolean, actions: Array, reasoning: string, metrics: Object }>}
   */
  async planTask({ task, sanitizedScreenshot, visibleElements = [], sanitizedDOM = null }) {
    const totalStart = Date.now();

    // 1. Check if Rule Planner mode explicitly requested for local debugging
    if (this.mode === 'rule') {
      console.log("[PLANNER] Mode: RULE (Rule-based fallback active)");
      return this.runRulePlanner({ task, visibleElements });
    }

    console.log(`[PLANNER] Mode: VLM (Provider: ${this.vlmProvider.name}, Model: ${this.vlmProvider.model})`);
    
    // 2. Format Prompts
    const userPromptText = buildUserPrompt(task, visibleElements, sanitizedDOM);

    // 3. Multimodal VLM Call (passing sanitized screenshot + prompt + DOM)
    let vlmResult;
    try {
      vlmResult = await this.vlmProvider.generatePlan({
        task,
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: userPromptText,
        sanitizedScreenshot,
        visibleElements
      });
    } catch (err) {
      console.error(`[PLANNER] VLM Provider call failed: ${err.message}`);
      const errorResponse = new Error(err.message || 'VLM provider execution failed.');
      errorResponse.code = err.code || 'MODEL_UNAVAILABLE';
      throw errorResponse;
    }

    const vlmLatencyMs = vlmResult.latencyMs || 0;
    console.log(`[PLANNER] VLM Inference Latency: ${vlmLatencyMs}ms`);

    // 4. Parse JSON & Validate Target Element Existence
    const parsedJSON = parseVLMOutput(vlmResult.rawOutput);
    const validatedPlan = validateActionPlan(parsedJSON, visibleElements);
    const totalPlanMs = Date.now() - totalStart;

    console.log(`[PLANNER] Action Validated: ${validatedPlan.actions[0]?.action} -> ${validatedPlan.actions[0]?.element_id || ''}`);
    console.log(`[PLANNER] Total Planner Latency: ${totalPlanMs}ms (VLM: ${vlmLatencyMs}ms, Validation: ${totalPlanMs - vlmLatencyMs}ms)`);

    return {
      success: true,
      status: validatedPlan.status,
      actions: validatedPlan.actions,
      reasoning: validatedPlan.reasoning,
      metrics: {
        vlmLatencyMs,
        totalPlanMs
      }
    };

  }

  /**
   * Rule-based fallback planner for development debugging when PLANNER_MODE=rule
   */
  runRulePlanner({ task, visibleElements }) {
    const lowerTask = (task || '').toLowerCase();
    let action = { action: 'wait', duration: 1000 };
    let reasoning = "Rule Planner: Task processed but did not match a rule.";

    if (lowerTask.includes('scroll down') || lowerTask.includes('scroll page down')) {
      action = { action: 'scroll', direction: 'down' };
      reasoning = "Rule Planner: Scroll down requested.";
    } else if (lowerTask.includes('scroll up')) {
      action = { action: 'scroll', direction: 'up' };
      reasoning = "Rule Planner: Scroll up requested.";
    } else if (lowerTask.includes('type') || lowerTask.includes('enter') || lowerTask.includes('fill')) {
      let val = "21";
      const num = task.match(/\b\d+\b/);
      if (num) val = num[0];

      const input = visibleElements.find(el => el.tag === 'input' || el.tag === 'textarea');
      if (input) {
        action = { action: 'type', element_id: input.id, text: val };
        reasoning = `Rule Planner: Found input element "${input.label || input.id}" and scheduled typing "${val}".`;
      }
    } else if (lowerTask.includes('click')) {
      const searchTarget = lowerTask.replace('click', '').trim();
      const target = visibleElements.find(el => {
        const lbl = (el.label || el.nameHint || el.idHint || '').toLowerCase();
        return searchTarget && lbl.includes(searchTarget);
      });
      if (target) {
        action = { action: 'click', element_id: target.id };
        reasoning = `Rule Planner: Matched element "${target.label || target.id}".`;
      }
    }

    return {
      success: true,
      actions: [action],
      reasoning,
      metrics: {
        vlmLatencyMs: 0,
        totalPlanMs: 5
      }
    };
  }
}

module.exports = AgentPlanner;
