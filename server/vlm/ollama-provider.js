const BaseVLMProvider = require('./provider');
const http = require('http');
const https = require('https');
const { URL } = require('url');

class OllamaVLMProvider extends BaseVLMProvider {
  constructor(config = {}) {
    super({
      name: 'ollama',
      model: config.model || process.env.VLM_MODEL || 'qwen3-vl:8b',
      baseUrl: config.baseUrl || process.env.VLM_BASE_URL || 'http://localhost:11434',
      timeoutMs: config.timeoutMs || parseInt(process.env.VLM_TIMEOUT_MS || '180000', 10)
    });
    this.numCtx = config.numCtx || parseInt(process.env.VLM_NUM_CTX || '16384', 10);
    this.numPredict = config.numPredict || parseInt(process.env.VLM_NUM_PREDICT || '1024', 10);
  }

  async generatePlan(params) {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await this._singleAttemptGeneratePlan(params);
      } catch (err) {
        const isTransient = err.code === 'MODEL_UNAVAILABLE' || err.code === 'ECONNRESET' || (err.message && (err.message.includes('503') || err.message.includes('500')));
        if (isTransient && attempt <= maxRetries) {
          console.warn(`[Ollama Provider] Transient connection/model error on attempt ${attempt}/${maxRetries + 1}: ${err.message}. Retrying in 2.5s...`);
          await new Promise(r => setTimeout(r, 2500));
          continue;
        }
        throw err;
      }
    }
  }

  async _singleAttemptGeneratePlan({ systemPrompt, userPrompt, sanitizedScreenshot }) {
    const startTime = Date.now();
    const parsedUrl = new URL(`${this.baseUrl}/api/chat`);
    const httpModule = parsedUrl.protocol === 'https:' ? https : http;

    // Clean Base64 string for Ollama (strip data URI prefix if present)
    let cleanBase64 = '';
    if (sanitizedScreenshot) {
      cleanBase64 = sanitizedScreenshot.replace(/^data:image\/\w+;base64,/, '');
    }

    const payload = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt,
          ...(cleanBase64 ? { images: [cleanBase64] } : {})
        }
      ],
      stream: false,
      format: 'json',
      options: {
        num_ctx: this.numCtx,
        num_predict: this.numPredict
      }
    };

    const postData = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      const req = httpModule.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: this.timeoutMs
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const latencyMs = Date.now() - startTime;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonResp = JSON.parse(body);
              let messageContent = jsonResp.message?.content || jsonResp.response || '';

              // Fallback: If content is empty string, check if JSON was emitted inside thinking block
              if (!messageContent && jsonResp.message?.thinking) {
                const thinkStr = jsonResp.message.thinking;
                const firstBrace = thinkStr.indexOf('{');
                const lastBrace = thinkStr.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                  messageContent = thinkStr.substring(firstBrace, lastBrace + 1);
                }
              }

              resolve({
                rawOutput: messageContent,
                latencyMs
              });
            } catch (err) {
              reject(new Error(`Ollama response JSON parse error: ${err.message}`));
            }
          } else {
            reject(new Error(`Ollama HTTP Error ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const err = new Error(`MODEL_TIMEOUT: Ollama VLM model call exceeded ${this.timeoutMs}ms limit.`);
        err.code = 'MODEL_TIMEOUT';
        reject(err);
      });

      req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
          const connErr = new Error(`MODEL_UNAVAILABLE: Could not connect to Ollama server at ${this.baseUrl} (${err.code}).`);
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

module.exports = OllamaVLMProvider;
