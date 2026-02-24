import { DocumentAnalysisProvider } from './types';
import { GeminiProvider } from './providers/GeminiProvider';
import { DeepSeekProvider } from './providers/DeepSeekProvider';
import { KimiProvider } from './providers/KimiProvider';
import { MiniMaxProvider } from './providers/MiniMaxProvider';
import { LlamaProvider } from './providers/LlamaProvider';

const getApiKey = (provider: string): string => {
    const envKey = `VITE_${provider}_API_KEY`;
    return (import.meta.env as any)[envKey] || '';
};

export class OCRFactory {
    private static providers: Map<string, DocumentAnalysisProvider> = new Map();
    
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
}
