import { AnalysisOptions, AnalysisResult } from '../types';
import { BaseProvider } from './BaseProvider';
import { buildCompliancePrompt, PROVIDER_PROMPTS } from '../prompts';

/**
 * DeepSeek Provider - Excellent for Asian languages
 * API: https://api.deepseek.com
 */
export class DeepSeekProvider extends BaseProvider {
    name = 'DeepSeek';
    modelId = 'deepseek-chat';
    
    constructor(apiKey: string) {
        super(apiKey, 'https://api.deepseek.com');
    }
    
    async analyze(fileBase64: string, mimeType: string, options: AnalysisOptions): Promise<AnalysisResult> {
        const prompt = this.buildPrompt(options);
        
        const response = await this.fetchWithAuth('/v1/chat/completions', {
            model: this.modelId,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: { url: this.toDataUrl(mimeType, fileBase64) }
                        }
                    ]
                }
            ],
            temperature: 0.0
        });
        
        const content = response.choices?.[0]?.message?.content;
        return this.parseResponse(content, options);
    }
    
    private buildPrompt(options: AnalysisOptions): string {
        const basePrompt = buildCompliancePrompt(options.fromCountry, options.toCountry, PROVIDER_PROMPTS.deepseek);
        return `${basePrompt}

Return JSON with this structure:
{
  "extractedData": {
    "documentType": "string",
    "products": [{ "name": "string", "hsCode": "string", "isOrganic": boolean }],
    "originCountry": "string",
    "destinationCountry": "string"
  },
  "checklist": [
    { "name": "string", "description": "string", "issuingAgency": "string", "category": "string" }
  ]
}

Respond ONLY with valid JSON.`;
    }
    
    private parseResponse(content: string, options: AnalysisOptions): AnalysisResult {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
            
            return {
                extractedData: {
                    ...parsed.extractedData,
                    originCountry: parsed.extractedData?.originCountry || options.fromCountry,
                    destinationCountry: parsed.extractedData?.destinationCountry || options.toCountry
                },
                checklist: parsed.checklist || []
            };
        } catch (e) {
            throw new Error(`Failed to parse ${this.name} response: ${e}`);
        }
    }
}
