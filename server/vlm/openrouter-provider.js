const BaseVLMProvider = require('./provider');
const http = require('http');
const https = require('https');
const { URL } = require('url');

class OpenRouterProvider extends BaseVLMProvider {
  constructor(config = {}) {
    super({
      name: 'openrouter',
      model: config.model || process.env.VLM_MODEL || 'google/gemma-4-26b-a4b-it:free',
      baseUrl: config.baseUrl || process.env.VLM_BASE_URL || 'https://openrouter.ai/api/v1',
      timeoutMs: config.timeoutMs || parseInt(process.env.VLM_TIMEOUT_MS || '120000', 10)
    });
    this.apiKey = config.apiKey || process.env.OPENROUTER_API_KEY || '';
  }

  async generatePlan(params) {
    if (!this.apiKey) {
      const err = new Error("OPENROUTER_API_KEY_MISSING: OPENROUTER_API_KEY environment variable is not configured on the server.");
      err.code = 'MODEL_UNAVAILABLE';
      throw err;
    }

    const startTime = Date.now();

    // Ensure endpoint URL correctly terminates with /chat/completions
    let endpointUrl = this.baseUrl.trim();
    if (!endpointUrl.endsWith('/chat/completions')) {
      endpointUrl = `${endpointUrl.replace(/\/$/, '')}/chat/completions`;
    }

    const parsedUrl = new URL(endpointUrl);
    const httpModule = parsedUrl.protocol === 'https:' ? https : http;

    // Ensure image is formatted as data URI (sanitized screenshot)
    let imageUri = params.sanitizedScreenshot || '';
    if (imageUri && !imageUri.startsWith('data:')) {
      imageUri = `data:image/png;base64,${imageUri}`;
    }

    const userContent = [];
    if (params.userPrompt) {
      userContent.push({ type: 'text', text: params.userPrompt });
    }
    if (imageUri) {
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUri }
      });
    }

    const payload = {
      model: this.model,
      messages: [
        ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
        { role: 'user', content: userContent.length > 0 ? userContent : (params.userPrompt || '') }
      ],
      response_format: { type: 'json_object' },
      stream: false
    };

    const postData = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'https://github.com/AbhiPatil1305/sih-privacy-agent',
      'X-Title': 'SIH Privacy Agent',
      'Content-Length': Buffer.byteLength(postData)
    };

    console.log(`[OpenRouter] Sending request to model="${this.model}" at ${endpointUrl}...`);

    return new Promise((resolve, reject) => {
      const req = httpModule.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers,
        timeout: this.timeoutMs
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const latencyMs = Date.now() - startTime;
          console.log(`[OpenRouter] Response received (HTTP ${res.statusCode}, Latency: ${latencyMs}ms)`);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonResp = JSON.parse(body);
              const choice = jsonResp.choices?.[0];
              if (!choice) {
                const emptyChoiceErr = new Error("MODEL_INVALID_OUTPUT: OpenRouter response missing choices array.");
                emptyChoiceErr.code = 'MODEL_INVALID_OUTPUT';
                return reject(emptyChoiceErr);
              }

              let messageContent = choice.message?.content || '';
              if (!messageContent && choice.message?.reasoning) {
                const thinkStr = choice.message.reasoning;
                const firstBrace = thinkStr.indexOf('{');
                const lastBrace = thinkStr.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                  messageContent = thinkStr.substring(firstBrace, lastBrace + 1);
                }
              }

              if (!messageContent) {
                const emptyMsgErr = new Error("MODEL_INVALID_OUTPUT: OpenRouter returned empty message content.");
                emptyMsgErr.code = 'MODEL_INVALID_OUTPUT';
                return reject(emptyMsgErr);
              }

              resolve({
                rawOutput: messageContent,
                latencyMs
              });
            } catch (err) {
              const parseErr = new Error(`MODEL_INVALID_OUTPUT: OpenRouter response JSON parse error: ${err.message}`);
              parseErr.code = 'MODEL_INVALID_OUTPUT';
              reject(parseErr);
            }
          } else {
            let parsedErr;
            try {
              parsedErr = JSON.parse(body);
            } catch (_) {}

            const errDetail = parsedErr?.error?.message || `HTTP Status ${res.statusCode}`;
            let errorObj;

            if (res.statusCode === 401 || res.statusCode === 403) {
              errorObj = new Error(`MODEL_UNAVAILABLE: OpenRouter Authentication Error (${res.statusCode}): ${errDetail}`);
              errorObj.code = 'MODEL_UNAVAILABLE';
            } else if (res.statusCode === 429) {
              errorObj = new Error(`MODEL_UNAVAILABLE: OpenRouter Rate Limit Exceeded (429): ${errDetail}`);
              errorObj.code = 'MODEL_UNAVAILABLE';
            } else if (res.statusCode === 400) {
              errorObj = new Error(`MODEL_INVALID_OUTPUT: OpenRouter Bad Request (400): ${errDetail}`);
              errorObj.code = 'MODEL_INVALID_OUTPUT';
            } else {
              errorObj = new Error(`MODEL_UNAVAILABLE: OpenRouter Server Error (${res.statusCode}): ${errDetail}`);
              errorObj.code = 'MODEL_UNAVAILABLE';
            }

            reject(errorObj);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const err = new Error(`MODEL_TIMEOUT: OpenRouter VLM call exceeded ${this.timeoutMs}ms limit.`);
        err.code = 'MODEL_TIMEOUT';
        reject(err);
      });

      req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
          const connErr = new Error(`MODEL_UNAVAILABLE: Could not connect to OpenRouter server at ${this.baseUrl} (${err.code}).`);
          connErr.code = 'MODEL_UNAVAILABLE';
          reject(connErr);
        } else {
          reject(err);
        }
      });

      req.write(postData);
      req.end();
    });
  }
}

module.exports = OpenRouterProvider;
