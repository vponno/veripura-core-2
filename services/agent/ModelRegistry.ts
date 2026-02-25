import { LLMProvider, ModelConfig } from './types';

/**
 * ModelRegistry: Central hub for managing "Plug-and-Play" LLMs and OCR models.
 * Allows skills to request specific capabilities (e.g., "Vision", "Legal") without
 * hardcoding the underlying provider.
 */
export class ModelRegistry {
    private static instance: ModelRegistry;
    private models: Map<string, ModelConfig> = new Map();

    private constructor() {
        // Register default "Expert" models
        // Can be overridden via environment variables
        const defaultModel = import.meta.env.VITE_DEFAULT_MODEL || 'gemini-2.5-flash';
        const visionModel = import.meta.env.VITE_VISION_MODEL || 'Qwen/Qwen2.5-VL-72B-Instruct';
        
        this.register('default', { provider: 'vertex', modelId: defaultModel });
        this.register('vision-pro', { provider: 'huggingface', modelId: visionModel });
        this.register('vision-fast', { provider: 'vertex', modelId: defaultModel });
        this.register('legal-expert', { provider: 'huggingface', modelId: 'nlpaueb/legal-bert-base-uncased' });
        this.register('doc-parser', { provider: 'huggingface', modelId: 'ibm/docling' });
    }

    public static getInstance(): ModelRegistry {
        if (!ModelRegistry.instance) {
            ModelRegistry.instance = new ModelRegistry();
        }
        return ModelRegistry.instance;
    }

    public register(alias: string, config: ModelConfig): void {
        this.models.set(alias, config);
    }

    public get(alias: string): ModelConfig | undefined {
        return this.models.get(alias) || this.models.get('default');
    }

    /**
     * Resolves the best model for a given task type if no specific alias is requested.
     */
    public resolveForTask(task: 'ocr' | 'reasoning' | 'summary'): ModelConfig {
        switch (task) {
            case 'ocr':
                return this.get('vision-pro')!;
            case 'reasoning':
                return this.get('default')!;
            case 'summary':
                return this.get('default')!;
            default:
                return this.get('default')!;
        }
    }
}
