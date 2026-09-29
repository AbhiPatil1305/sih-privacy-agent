/**
 * Action Schema Validation & Target Element Existence Checker
 */

const ALLOWED_ACTION_TYPES = ['click', 'type', 'scroll', 'navigate', 'select', 'wait'];

/**
 * Parses raw VLM text output into structured JSON object.
 */
function parseVLMOutput(rawOutput) {
  if (!rawOutput || typeof rawOutput !== 'string') {
    throw new Error("MODEL_INVALID_OUTPUT: VLM returned empty or non-string response.");
  }

  let cleaned = rawOutput.trim();

  // Strip markdown code fences if VLM included them
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Handle embedded JSON object if wrapped in text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const parseErr = new Error(`MODEL_INVALID_OUTPUT: Failed to parse VLM response as JSON. Raw output snippet: "${rawOutput.substring(0, 100)}..."`);
    parseErr.code = 'MODEL_INVALID_OUTPUT';
    throw parseErr;
  }
}

/**
 * Validates parsed VLM action structure and verifies target element existence in visibleElements.
 * @param {Object} parsedJSON - Object parsed from VLM output
 * @param {Array} visibleElements - Available DOM elements from request
 * @returns {{ actions: Array, reasoning: string }}
 */
function validateActionPlan(parsedJSON, visibleElements = []) {
  if (!parsedJSON || typeof parsedJSON !== 'object') {
    throw new Error("MODEL_INVALID_OUTPUT: VLM plan is not a valid JSON object.");
  }

  const rawStatus = (parsedJSON.status || '').toLowerCase();
  const isComplete = rawStatus === 'complete' || parsedJSON.completed === true;

  // Safe reasoning explanation
  let safeReasoning = "VLM analyzed visual screenshot and DOM structure.";
  if (parsedJSON.reasoning && typeof parsedJSON.reasoning === 'string') {
    safeReasoning = parsedJSON.reasoning.substring(0, 200).trim();
  }

  if (isComplete) {
    return {
      status: 'complete',
      actions: [],
      reasoning: safeReasoning || "Task completed successfully according to VLM planner."
    };
  }

  let rawActions = parsedJSON.actions;
  if (!rawActions && parsedJSON.action) {
    rawActions = [parsedJSON];
  }

  if (!Array.isArray(rawActions) || rawActions.length === 0) {
    // If no action provided but not explicitly complete, check if task complete
    return {
      status: 'complete',
      actions: [],
      reasoning: safeReasoning || "Task finished (no further actions required)."
    };
  }

  const validElementsMap = new Map();
  visibleElements.forEach(el => validElementsMap.set(el.id, el));

  // ENFORCE SINGLE ACTION PER ITERATION (Section 6)
  const act = rawActions[0];

  if (!act || typeof act !== 'object' || !act.action) {
    throw new Error("MODEL_INVALID_OUTPUT: Action item missing required 'action' field.");
  }

  const actionType = String(act.action).toLowerCase();
  if (!ALLOWED_ACTION_TYPES.includes(actionType)) {
    throw new Error(`MODEL_INVALID_OUTPUT: Unsupported action type "${actionType}".`);
  }

  const validatedActions = [];

  if (['click', 'type', 'select'].includes(actionType)) {
    const elementId = act.element_id || act.targetId || act.target_id;

    if (!elementId) {
      throw new Error(`MODEL_INVALID_OUTPUT: Action "${actionType}" requires 'element_id'.`);
    }

    // STRICT TARGET VALIDATION: Verify target element exists in CURRENT visibleElements
    if (!validElementsMap.has(elementId)) {
      const targetErr = new Error(`INVALID_TARGET: VLM targeted element ID "${elementId}" which does not exist in visible DOM elements list.`);
      targetErr.code = 'INVALID_TARGET';
      throw targetErr;
    }

    if (actionType === 'click') {
      validatedActions.push({
        action: 'click',
        element_id: elementId
      });
    } else if (actionType === 'type') {
      const textToType = typeof act.text === 'string' ? act.text : String(act.text || '');
      validatedActions.push({
        action: 'type',
        element_id: elementId,
        text: textToType
      });
    } else if (actionType === 'select') {
      validatedActions.push({
        action: 'select',
        element_id: elementId,
        value: String(act.value || '')
      });
    }
  } else if (actionType === 'scroll') {
    const dir = (act.direction === 'up' || act.direction === 'UP') ? 'up' : 'down';
    validatedActions.push({
      action: 'scroll',
      direction: dir
    });
  } else if (actionType === 'wait') {
    validatedActions.push({
      action: 'wait',
      duration: typeof act.duration === 'number' ? act.duration : 1000
    });
  }

  return {
    status: 'continue',
    actions: validatedActions,
    reasoning: safeReasoning
  };
}


module.exports = {
  parseVLMOutput,
  validateActionPlan
};
