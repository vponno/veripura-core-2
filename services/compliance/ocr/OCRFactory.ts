import { DocumentAnalysisProvider, AnalysisOptions, AnalysisResult } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { DeepSeekProvider } from './providers/DeepSeekProvider';
import { KimiProvider } from './providers/KimiProvider';
import { MiniMaxProvider } from './providers/MiniMaxProvider';
import { LlamaProvider } from './providers/LlamaProvider';

const getApiKey = (provider: string): string => {
    const envKey = `VITE_${provider}_API_KEY`;
    return (import.meta.env as any)[envKey] || '';
};

/**
 * Simple hash function for caching
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

/**
 * Cache entry
 */
interface CacheEntry {
    result: AnalysisResult;
    timestamp: number;
}

export interface ProviderConfig {
    name: string;
    apiKey?: string;
    baseUrl?: string;
}

export interface CacheConfig {
    enabled: boolean;
    ttlMs: number;  // Time to live in milliseconds
    maxEntries: number;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
    enabled: true,
    ttlMs: 15 * 60 * 1000,  // 15 minutes
    maxEntries: 100,
};

export class OCRFactory {
    private static providers: Map<string, DocumentAnalysisProvider> = new Map();
    private static cache: Map<string, CacheEntry> = new Map();
    private static cacheConfig: CacheConfig = { ...DEFAULT_CACHE_CONFIG };
    
    /**
     * Configure the cache
     */
    static configureCache(config: Partial<CacheConfig>): void {
        this.cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
        
        // Clear cache if disabled
        if (!this.cacheConfig.enabled) {
            this.cache.clear();
        }
    }
    
    /**
     * Generate cache key from input
     */
    private static getCacheKey(fileBase64: string, options: AnalysisOptions): string {
        const content = `${fileBase64.slice(0, 100)}_${options.fromCountry}_${options.toCountry}`;
        return simpleHash(content);
    }
    
    /**
     * Get cached result if available and not expired
     */
    private static getCachedResult(key: string): AnalysisResult | null {
        if (!this.cacheConfig.enabled) return null;
        
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        const age = Date.now() - entry.timestamp;
        if (age > this.cacheConfig.ttlMs) {
            this.cache.delete(key);
            return null;
        }
        
        console.log(`[OCRFactory] Cache HIT for key: ${key.slice(0, 8)}...`);
        return entry.result;
    }
    
    /**
     * Store result in cache
     */
    private static setCachedResult(key: string, result: AnalysisResult): void {
        if (!this.cacheConfig.enabled) return;
        
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.cacheConfig.maxEntries) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            result,
            timestamp: Date.now(),
        });
    }
    
    static register(provider: DocumentAnalysisProvider) {
        this.providers.set(provider.name, provider);
    }
    
    static getProvider(name?: string): DocumentAnalysisProvider {
        const providerName = name || (import.meta.env as any).VITE_OCR_PROVIDER || 'Gemini';
        
        if (this.providers.has(providerName)) {
            return this.providers.get(providerName)!;
        }
        
        switch (providerName) {
            case 'DeepSeek':
                const deepseekKey = getApiKey('DEEPSEEK');
                if (!deepseekKey) throw new Error('VITE_DEEPSEEK_API_KEY not set');
                this.register(new DeepSeekProvider(deepseekKey));
                break;
                
            case 'Kimi':
                const kimiKey = getApiKey('KIMI');
                if (!kimiKey) throw new Error('VITE_KIMI_API_KEY not set');
                this.register(new KimiProvider(kimiKey));
                break;
                
            case 'MiniMax':
                const minimaxKey = getApiKey('MINIMAX');
                if (!minimaxKey) throw new Error('VITE_MINIMAX_API_KEY not set');
                this.register(new MiniMaxProvider(minimaxKey));
                break;
                
            case 'Llama':
                const llamaKey = getApiKey('LLAMA');
                const llamaUrl = (import.meta.env as any).VITE_LLAMA_BASE_URL;
                if (!llamaKey) throw new Error('VITE_LLAMA_API_KEY not set');
                this.register(new LlamaProvider(llamaKey, llamaUrl));
                break;
                
            case 'Gemini':
            default:
                const geminiKey = getApiKey('GEMINI');
                if (!geminiKey) throw new Error('VITE_GEMINI_API_KEY not set');
                this.register(new GeminiProvider(geminiKey));
                break;
        }
        
        return this.providers.get(providerName)!;
    }
    
    static getAvailableProviders(): string[] {
        return ['Gemini', 'DeepSeek', 'Kimi', 'MiniMax', 'Llama'];
    }

    /**
     * Get all available provider names that have valid API keys configured
     */
    static getConfiguredProviders(): string[] {
        const available = this.getAvailableProviders();
        return available.filter(name => {
            try {
                this.getProvider(name);
                return true;
            } catch {
                return false;
            }
        });
    }

    /**
     * Analyze with automatic fallback to next provider if current one fails
     * Includes caching
     */
    static async analyzeWithFallback(
        fileBase64: string,
        mimeType: string,
        options: AnalysisOptions,
        preferredProvider?: string,
        useCache: boolean = true
    ): Promise<AnalysisResult> {
        // Check cache first
        if (useCache) {
            const cacheKey = this.getCacheKey(fileBase64, options);
            const cached = this.getCachedResult(cacheKey);
            if (cached) return cached;
        }
        
        const providers = this.getConfiguredProviders();
        
        if (providers.length === 0) {
            throw new Error('No OCR providers configured. Please set at least one VITE_*_API_KEY.');
        }

        // Reorder: preferred provider first, then others
        let orderedProviders: string[];
        if (preferredProvider && providers.includes(preferredProvider)) {
            orderedProviders = [
                preferredProvider,
                ...providers.filter(p => p !== preferredProvider)
            ];
        } else {
            orderedProviders = providers;
        }

        const errors: string[] = [];

        for (const providerName of orderedProviders) {
            try {
                const provider = this.getProvider(providerName);
                console.log(`[OCRFactory] Attempting analysis with ${providerName}...`);
                
                const result = await provider.analyze(fileBase64, mimeType, options);
                console.log(`[OCRFactory] Success with ${providerName}`);
                
                // Cache the result
                if (useCache) {
                    const cacheKey = this.getCacheKey(fileBase64, options);
                    this.setCachedResult(cacheKey, result);
                }
                
                return result;
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.warn(`[OCRFactory] ${providerName} failed: ${errorMsg}`);
                errors.push(`${providerName}: ${errorMsg}`);
                
                // Continue to next provider
                continue;
            }
        }

        throw new Error(`All OCR providers failed. Errors: ${errors.join('; ')}`);
    }
}
