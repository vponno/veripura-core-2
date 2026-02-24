import { AnalysisOptions, AnalysisResult } from '../types';
import { BaseProvider } from './BaseProvider';

export class LlamaProvider extends BaseProvider {
    name = 'Llama';
    baseUrl = '';
    modelId = 'meta-llama-3.2-11b-vision-instruct';
    
    constructor(apiKey: string, baseUrl?: string) {
        super(apiKey, baseUrl || 'https://api.together.ai/v1');
    }
    
    async analyze(fileBase64: string, mimeType: string, options: AnalysisOptions): Promise<AnalysisResult> {
        const prompt = this.buildPrompt(options);
        
        const response = await this.fetchWithAuth('/chat/completions', {
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
            max_tokens: 2048,
            temperature: 0.0
        });
        
        const content = response.choices?.[0]?.message?.content;
        return this.parseResponse(content, options);
    }
    
    private buildPrompt(options: AnalysisOptions): string {
        return `You are VeriPura AI, an expert in international trade compliance.

Analyze this document and extract key information for customs and compliance purposes.

Extract:
- Document type and reference number
- All products with quantities and HS tariff codes
- Country of origin and destination
- Any certifications (organic, fair trade, etc.)
- Security/tampering indicators

Then determine required documents for: ${options.fromCountry} → ${options.toCountry}

Respond with valid JSON only:
{
  "extractedData": {
    "documentType": "string",
    "products": [{"name": "string", "quantity": "string", "hsCode": "string", "isOrganic": boolean}],
    "originCountry": "string",
    "destinationCountry": "string"
  },
  "checklist": [{"name": "string", "description": "string", "issuingAgency": "string", "category": "string"}]
}`;
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
