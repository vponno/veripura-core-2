import { AnalysisOptions, AnalysisResult, DocumentAnalysisProvider } from '../types';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  timeoutMs?: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  timeoutMs: 60000,
};

/**
 * Logging configuration
 */
export interface LoggingConfig {
  enabled: boolean;
  logRequests: boolean;
  logResponses: boolean;
  logErrors: boolean;
}

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  enabled: true,
  logRequests: true,
  logResponses: false, // May contain sensitive data
  logErrors: true,
};

/**
 * Request/Response log entry
 */
export interface RequestLog {
  timestamp?: string;
  provider?: string;
  modelId?: string;
  endpoint: string;
  durationMs?: number;
  status?: 'success' | 'error' | 'timeout';
  error?: string;
  retryCount?: number;
}

/**
 * Base class for all LLM OCR providers
 * Implement this to add support for new LLM backends
 */
export abstract class BaseProvider implements DocumentAnalysisProvider {
    abstract name: string;
    abstract modelId: string;
    
    protected apiKey: string;
    protected baseUrl: string;
    protected retryConfig: RetryConfig;
    protected loggingConfig: LoggingConfig;
    
    constructor(
        apiKey: string, 
        baseUrl: string, 
        retryConfig?: Partial<RetryConfig>,
        loggingConfig?: Partial<LoggingConfig>
    ) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
        this.loggingConfig = { ...DEFAULT_LOGGING_CONFIG, ...loggingConfig };
    }
    
    abstract analyze(fileBase64: string, mimeType: string, options: AnalysisOptions): Promise<AnalysisResult>;
    
    /**
     * Log a request/response entry
     */
    protected log(entry: RequestLog): void {
        if (!this.loggingConfig.enabled) return;
        
        const logEntry = {
            ...entry,
            timestamp: entry.timestamp || new Date().toISOString(),
            provider: this.name,
            modelId: this.modelId,
        };
        
        if (entry.status === 'error' && this.loggingConfig.logErrors) {
            console.error(`[OCR:${this.name}]`, logEntry);
        } else if (this.loggingConfig.logRequests) {
            console.log(`[OCR:${this.name}]`, logEntry);
        }
    }

    /**
     * Create a timing wrapper for any async operation
     */
    protected async withLogging<T>(
        operation: () => Promise<T>,
        endpoint: string
    ): Promise<T> {
        const startTime = Date.now();
        
        try {
            const result = await operation();
            
            this.log({
                endpoint,
                durationMs: Date.now() - startTime,
                status: 'success',
            });
            
            return result;
        } catch (error) {
            this.log({
                endpoint,
                durationMs: Date.now() - startTime,
                status: 'error',
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    
    /**
     * Convert file to base64 data URL
     */
    protected toDataUrl(mimeType: string, base64: string): string {
        return `data:${mimeType};base64,${base64}`;
    }
    
    /**
     * Execute a function with retry logic and exponential backoff
     */
    protected async withRetry<T>(
        operation: () => Promise<T>,
        customConfig?: Partial<RetryConfig>
    ): Promise<T> {
        const config = { ...this.retryConfig, ...customConfig };
        let lastError: Error | undefined;
        
        for (let attempt = 0; attempt < config.maxRetries; attempt++) {
            try {
                // Add timeout wrapper if configured
                if (config.timeoutMs) {
                    return await this.withTimeout(operation(), config.timeoutMs);
                }
                return await operation();
            } catch (error) {
                lastError = error as Error;
                const isRetryable = this.isRetryableError(error);
                
                console.warn(
                    `[${this.name}] Attempt ${attempt + 1}/${config.maxRetries} failed: ${lastError.message}`,
                    { retryable: isRetryable }
                );
                
                if (!isRetryable || attempt === config.maxRetries - 1) {
                    throw lastError;
                }
                
                // Exponential backoff with jitter
                const delay = Math.min(
                    config.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
                    config.maxDelayMs
                );
                
                console.log(`[${this.name}] Retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
        
        throw lastError;
    }
    
    /**
     * Check if an error is retryable (network errors, rate limits, timeouts)
     */
    protected isRetryableError(error: any): boolean {
        if (!error) return false;
        
        const message = error.message?.toLowerCase() || '';
        
        // Network errors
        if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
            return true;
        }
        
        // Rate limiting (429)
        if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
            return true;
        }
        
        // Server errors (5xx)
        if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Wrap a promise with a timeout
     */
    private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            promise,
            this.sleep(timeoutMs).then(() => {
                throw new Error(`Request timeout after ${timeoutMs}ms`);
            })
        ]);
    }
    
    /**
     * Sleep utility
     */
    protected sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Generic fetch wrapper with retry and timeout
     */
    protected async fetchWithAuth(endpoint: string, body: any): Promise<any> {
        return this.withRetry(async () => {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`${this.name} API Error: ${response.status} - ${error}`);
            }
            
            return response.json();
        });
    }
}
