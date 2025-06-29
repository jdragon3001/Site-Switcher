// OpenAI API Client
// Handles communication with OpenAI API, including error handling and rate limiting

class OpenAIClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openai.com/v1';
        this.rateLimiter = new RateLimiter();
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        };
    }

    // Generate content using GPT-4
    async generateContent(prompt, options = {}) {
        const {
            model = 'gpt-4',
            temperature = 0.7,
            maxTokens = 200,
            systemPrompt = 'You are a professional copywriter. Generate concise, contextually appropriate replacement text. Output only the replacement text without quotes, formatting, or explanations.'
        } = options;

        try {
            // Check rate limits
            await this.rateLimiter.waitIfNeeded();

            const response = await this.makeRequest('/chat/completions', {
                model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature,
                max_tokens: maxTokens,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            });

            return {
                success: true,
                content: response.choices[0]?.message?.content?.trim(),
                usage: response.usage,
                model: response.model
            };

        } catch (error) {
            console.error('OpenAI API error:', error);
            return {
                success: false,
                error: error.message,
                type: error.type || 'unknown'
            };
        }
    }

    // Generate multiple variations
    async generateVariations(prompt, count = 3, options = {}) {
        const promises = Array(count).fill(null).map(() => 
            this.generateContent(prompt, { ...options, temperature: 0.8 })
        );

        const results = await Promise.allSettled(promises);
        
        return results.map((result, index) => ({
            index,
            success: result.status === 'fulfilled' && result.value.success,
            content: result.status === 'fulfilled' ? result.value.content : null,
            error: result.status === 'rejected' ? result.reason.message : 
                   (result.value.success ? null : result.value.error)
        }));
    }

    // Make API request with retry logic
    async makeRequest(endpoint, data, attempt = 0) {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'User-Agent': 'Site-Switcher-Extension/1.0'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new APIError(
                    errorData.error?.message || 'API request failed',
                    response.status,
                    errorData.error?.type || 'api_error',
                    errorData.error?.code
                );
            }

            const responseData = await response.json();
            
            // Update rate limiter with response headers
            this.rateLimiter.updateFromHeaders(response.headers);
            
            return responseData;

        } catch (error) {
            if (this.shouldRetry(error, attempt)) {
                const delay = this.calculateRetryDelay(attempt);
                console.log(`Retrying request in ${delay}ms (attempt ${attempt + 1})`);
                
                await this.delay(delay);
                return this.makeRequest(endpoint, data, attempt + 1);
            }
            
            throw error;
        }
    }

    // Check if error is retryable
    shouldRetry(error, attempt) {
        if (attempt >= this.retryConfig.maxRetries) {
            return false;
        }

        // Retry on rate limit errors
        if (error.status === 429) {
            return true;
        }

        // Retry on server errors
        if (error.status >= 500) {
            return true;
        }

        // Retry on network errors
        if (error.name === 'TypeError' || error.name === 'NetworkError') {
            return true;
        }

        return false;
    }

    // Calculate retry delay with exponential backoff
    calculateRetryDelay(attempt) {
        const baseDelay = this.retryConfig.baseDelay;
        const maxDelay = this.retryConfig.maxDelay;
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        
        return delay + jitter;
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Validate API key format
    static validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, error: 'API key is required' };
        }

        if (!apiKey.startsWith('sk-')) {
            return { valid: false, error: 'API key must start with "sk-"' };
        }

        if (apiKey.length < 20) {
            return { valid: false, error: 'API key appears to be too short' };
        }

        return { valid: true };
    }

    // Test API key
    async testApiKey() {
        try {
            const response = await this.makeRequest('/models', {});
            return { valid: true, models: response.data };
        } catch (error) {
            return { 
                valid: false, 
                error: error.message,
                type: error.type 
            };
        }
    }

    // Get account usage
    async getUsage() {
        try {
            const response = await this.makeRequest('/usage', {});
            return { success: true, usage: response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Rate limiter class
class RateLimiter {
    constructor() {
        this.requests = [];
        this.limits = {
            requestsPerMinute: 60,
            tokensPerMinute: 10000
        };
        this.tokens = 0;
    }

    // Wait if rate limit would be exceeded
    async waitIfNeeded() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Clean old requests
        this.requests = this.requests.filter(req => req.timestamp > oneMinuteAgo);
        
        // Check if we need to wait
        if (this.requests.length >= this.limits.requestsPerMinute) {
            const oldestRequest = this.requests[0];
            const waitTime = 60000 - (now - oldestRequest.timestamp);
            
            if (waitTime > 0) {
                console.log(`Rate limit reached, waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        // Add current request
        this.requests.push({ timestamp: now });
    }

    // Update limits from API response headers
    updateFromHeaders(headers) {
        const remaining = headers.get('x-ratelimit-remaining-requests');
        const tokensRemaining = headers.get('x-ratelimit-remaining-tokens');
        
        if (remaining) {
            this.limits.requestsPerMinute = parseInt(remaining);
        }
        
        if (tokensRemaining) {
            this.limits.tokensPerMinute = parseInt(tokensRemaining);
        }
    }
}

// Custom API Error class
class APIError extends Error {
    constructor(message, status, type, code) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.type = type;
        this.code = code;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OpenAIClient, RateLimiter, APIError };
} else {
    window.OpenAIClient = OpenAIClient;
    window.RateLimiter = RateLimiter;
    window.APIError = APIError;
} 