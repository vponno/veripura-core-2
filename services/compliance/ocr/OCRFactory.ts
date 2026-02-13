import { DocumentAnalysisProvider } from './types';
import { GeminiProvider } from './providers/GeminiProvider';

export class OCRFactory {
    private static providers: Map<string, DocumentAnalysisProvider> = new Map();

    static register(provider: DocumentAnalysisProvider) {
        this.providers.set(provider.name, provider);
    }

    static getProvider(name: string = 'Gemini'): DocumentAnalysisProvider {
        if (!this.providers.has(name)) {
            // Lazy instantiation of default provider if not registered
            if (name === 'Gemini') {
                const provider = new GeminiProvider();
                this.register(provider);
                return provider;
            }
            throw new Error(`OCR Provider '${name}' not found.`);
        }
        return this.providers.get(name)!;
    }
}
