const OllamaVLMProvider = require('./ollama-provider');
const OpenAIVLMProvider = require('./openai-provider');
const MockVLMProvider = require('./mock-vlm-provider');

function createVLMProvider(config = {}) {
  const providerName = (config.provider || process.env.VLM_PROVIDER || 'ollama').toLowerCase();

  switch (providerName) {
    case 'ollama':
      return new OllamaVLMProvider(config);
    case 'openai':
    case 'vllm':
    case 'lmstudio':
      return new OpenAIVLMProvider(config);
    case 'mock':
      return new MockVLMProvider(config);
    default:
      console.warn(`[VLM Factory] Unknown VLM provider "${providerName}", defaulting to Ollama provider.`);
      return new OllamaVLMProvider(config);
  }
}

module.exports = {
  createVLMProvider,
  OllamaVLMProvider,
  OpenAIVLMProvider,
  MockVLMProvider
};
