const BaseVLMProvider = require('./provider');

class MockVLMProvider extends BaseVLMProvider {
  constructor(config = {}) {
    super({
      name: 'mock',
      model: config.model || 'mock-vlm-v1',
      baseUrl: 'local://mock',
      timeoutMs: config.timeoutMs || 5000
    });
  }

  async generatePlan({ task, sanitizedScreenshot, visibleElements }) {
    const startTime = Date.now();
    await new Promise(r => setTimeout(r, 100)); // Simulate inference latency

    const lowerTask = (task || '').toLowerCase();
    let status = 'continue';
    let action = { action: 'wait', duration: 1000 };
    let reasoning = "Mock VLM: Inspected visual screenshot and DOM elements.";

    // Multi-step workflow heuristic for test tasks
    // E.g. Task: "Search for Alice and view her profile"
    const isInput = (el) => {
      const tag = (el.tag || el.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea';
    };

    const isButton = (el) => {
      const tag = (el.tag || el.tagName || '').toLowerCase();
      return tag === 'button' || el.role === 'button';
    };

    const getElText = (el) => (el.text || el.textContent || el.label || '').trim();
    const getElId = (el) => el.id || el.idHint || '';
    const getElHint = (el) => (getElId(el) + ' ' + (el.nameHint || '') + ' ' + (el.label || '') + ' ' + (el.attributes?.placeholder || '')).toLowerCase();

    const searchInput = visibleElements.find(el => isInput(el) && getElHint(el).includes('search'));

    const searchBtn = visibleElements.find(el => isButton(el) && getElHint(el).includes('search'));

    const resultLink = visibleElements.find(el => {
      const tag = (el.tag || el.tagName || '').toLowerCase();
      const hint = (getElHint(el) + ' ' + getElText(el)).toLowerCase();
      return (tag === 'a' || tag === 'button' || tag === 'div') && hint.includes('alice');
    });

    const profileHeader = visibleElements.find(el => {
      const hint = (getElHint(el) + ' ' + getElText(el)).toLowerCase();
      return hint.includes('alice smith') || hint.includes('profile verified') || hint.includes('profile details');
    });

    if (profileHeader || lowerTask.includes('finish') || (lowerTask.includes('verify') && profileHeader)) {
      status = 'complete';
      action = null;
      reasoning = "Mock VLM: Alice profile page reached. Task completed successfully.";
    } else if (searchInput && !getElText(searchInput) && !searchInput.hasTyped) {
      // Step 1: Type "Alice" into search input
      status = 'continue';
      action = { action: 'type', element_id: getElId(searchInput), text: 'Alice' };
      reasoning = "Mock VLM: Located search input. Typing 'Alice'.";
    } else if (searchBtn && (searchInput ? getElText(searchInput) || searchInput.hasTyped : true)) {
      // Step 2: Click search button
      status = 'continue';
      action = { action: 'click', element_id: getElId(searchBtn) };
      reasoning = "Mock VLM: Clicking search button to submit query.";
    } else if (resultLink) {
      // Step 3: Click search result link
      status = 'continue';
      action = { action: 'click', element_id: getElId(resultLink) };
      reasoning = "Mock VLM: Located Alice profile link in search results. Clicking link.";
    } else if (lowerTask.includes('scroll')) {
      status = 'continue';
      action = { action: 'scroll', direction: lowerTask.includes('up') ? 'up' : 'down' };
      reasoning = `Mock VLM: Interpreted task visual intent to scroll ${action.direction}.`;
    } else if (lowerTask.includes('type') || lowerTask.includes('enter') || lowerTask.includes('fill')) {
      let val = "21";
      const num = task.match(/\b\d+\b/);
      if (num) val = num[0];

      const input = visibleElements.find(el => el.tag === 'input' || el.tag === 'textarea');
      if (input) {
        status = 'continue';
        action = { action: 'type', element_id: input.id, text: val };
        reasoning = `Mock VLM: Identified visual target element "${input.label || input.id}" and scheduled typing "${val}".`;
      } else {
        status = 'complete';
        action = null;
        reasoning = "Mock VLM: Input completed.";
      }
    } else if (lowerTask.includes('click')) {
      const search = lowerTask.replace('click', '').trim();
      const target = visibleElements.find(el => {
        const lbl = (el.label || el.nameHint || el.idHint || '').toLowerCase();
        return search && lbl.includes(search);
      });
      if (target) {
        status = 'continue';
        action = { action: 'click', element_id: target.id };
        reasoning = `Mock VLM: Visual perception matched target element "${target.label || target.id}".`;
      } else {
        status = 'complete';
        action = null;
        reasoning = `Mock VLM: Target element "${search}" satisfied or not found. Task completed.`;
      }
    }

    return {
      rawOutput: JSON.stringify({
        status,
        actions: action ? [action] : [],
        reasoning
      }),
      latencyMs: Date.now() - startTime
    };
  }
}

module.exports = MockVLMProvider;

