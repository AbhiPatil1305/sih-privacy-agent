const BaseVLMProvider = require('./provider');
const http = require('http');
const https = require('https');
const { URL } = require('url');

class OpenAIVLMProvider extends BaseVLMProvider {
  constructor(config = {}) {
    super({
      name: 'openai',
      model: config.model || process.env.VLM_MODEL || 'gpt-4o-mini',
      baseUrl: config.baseUrl || process.env.VLM_BASE_URL || 'https://api.openai.com',
      timeoutMs: config.timeoutMs || parseInt(process.env.VLM_TIMEOUT_MS || '15000', 10)
    });
    this.apiKey = config.apiKey || process.env.VLM_API_KEY || '';
  }

  async generatePlan({ systemPrompt, userPrompt, sanitizedScreenshot }) {
    const startTime = Date.now();
    const endpointUrl = this.baseUrl.endsWith('/v1/chat/completions') 
      ? this.baseUrl 
      : `${this.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

    const parsedUrl = new URL(endpointUrl);
    const httpModule = parsedUrl.protocol === 'https:' ? https : http;

    // Ensure image is formatted as data URI
    let imageUri = sanitizedScreenshot || '';
    if (imageUri && !imageUri.startsWith('data:')) {
      imageUri = `data:image/png;base64,${imageUri}`;
    }

    const userContent = [{ type: 'text', text: userPrompt }];
    if (imageUri) {
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUri }
      });
    }

    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      response_format: { type: 'json_object' }
    };

    const postData = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

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
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonResp = JSON.parse(body);
              const messageContent = jsonResp.choices?.[0]?.message?.content || '';
              resolve({
                rawOutput: messageContent,
                latencyMs
              });
            } catch (err) {
              reject(new Error(`OpenAI response JSON parse error: ${err.message}`));
            }
          } else {
            reject(new Error(`OpenAI HTTP Error ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const err = new Error(`MODEL_TIMEOUT: OpenAI/Compatible VLM call exceeded ${this.timeoutMs}ms limit.`);
        err.code = 'MODEL_TIMEOUT';
        reject(err);
      });

      req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          const connErr = new Error(`MODEL_UNAVAILABLE: Could not connect to OpenAI/Compatible VLM server at ${this.baseUrl}.`);
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

module.exports = OpenAIVLMProvider;
