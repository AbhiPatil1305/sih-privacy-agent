/**
 * Abstract Base Class for Server-Side VLM Providers
 */
class BaseVLMProvider {
  constructor(config = {}) {
    this.name = config.name || 'base-vlm';
    this.model = config.model || 'default-model';
    this.baseUrl = config.baseUrl || '';
    this.timeoutMs = config.timeoutMs || 15000;
  }

  /**
   * Generates plan from multimodal inputs (sanitized screenshot + sanitized DOM + task)
   * @param {Object} params
   * @param {string} params.task - User task instruction
   * @param {string} params.sanitizedScreenshot - Base64 image data URL or raw base64
   * @param {Array} params.visibleElements - Array of DOM elements with bounding boxes
   * @param {Object} params.sanitizedDOM - Viewport & element tree metadata
   * @returns {Promise<{ rawOutput: string, latencyMs: number }>}
   */
  async generatePlan(params) {
    throw new Error("generatePlan method must be implemented by concrete VLM provider.");
  }
}

module.exports = BaseVLMProvider;
