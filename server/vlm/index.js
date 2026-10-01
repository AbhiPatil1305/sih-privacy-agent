const OllamaVLMProvider = require('./ollama-provider');
const OpenRouterProvider = require('./openrouter-provider');
const OpenAIVLMProvider = require('./openai-provider');
const MockVLMProvider = require('./mock-vlm-provider');

function createVLMProvider(config = {}) {
  const providerName = (config.provider || process.env.VLM_PROVIDER || 'ollama').toLowerCase();

  switch (providerName) {
    case 'ollama':
      return new OllamaVLMProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
    case 'openai':
    case 'vllm':
    case 'lmstudio':
      return new OpenAIVLMProvider(config);
    case 'mock':
      return new MockVLMProvider(config);
    default:
      const err = new Error(`MODEL_UNAVAILABLE: Unknown VLM provider "${providerName}". Supported providers: ollama, openrouter, openai, mock.`);
      err.code = 'MODEL_UNAVAILABLE';
      throw err;
  }
}

module.exports = {
  createVLMProvider,
  OllamaVLMProvider,
  OpenRouterProvider,
  OpenAIVLMProvider,
  MockVLMProvider
};
