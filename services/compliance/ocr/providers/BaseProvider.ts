import { AnalysisOptions, AnalysisResult, DocumentAnalysisProvider } from '../types';

/**
 * Base class for all LLM OCR providers
 * Implement this to add support for new LLM backends
 */
export abstract class BaseProvider implements DocumentAnalysisProvider {
    abstract name: string;
    abstract modelId: string;
    
    protected apiKey: string;
    protected baseUrl: string;
    
    constructor(apiKey: string, baseUrl: string) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    
    abstract analyze(fileBase64: string, mimeType: string, options: AnalysisOptions): Promise<AnalysisResult>;
    
    /**
     * Convert file to base64 data URL
     */
    protected toDataUrl(mimeType: string, base64: string): string {
        return `data:${mimeType};base64,${base64}`;
    }
    
    /**
     * Generic fetch wrapper
     */
    protected async fetchWithAuth(endpoint: string, body: any): Promise<any> {
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
    }
}
