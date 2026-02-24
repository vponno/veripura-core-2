import { AnalysisOptions, AnalysisResult } from '../types';
import { BaseProvider } from './BaseProvider';

export class MiniMaxProvider extends BaseProvider {
    name = 'MiniMax';
    baseUrl = 'https://api.minimax.chat/v1';
    modelId = 'MiniMax-M2.5';
    
    constructor(apiKey: string) {
        super(apiKey, 'https://api.minimax.chat/v1');
    }
    
    async analyze(fileBase64: string, mimeType: string, options: AnalysisOptions): Promise<AnalysisResult> {
        const prompt = this.buildPrompt(options);
        
        const response = await this.fetchWithAuth('/text/chatcompletion_v2', {
            model: this.modelId,
            messages: [
                {
                    role: 'user',
                    contents: [
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
        return `You are VeriPura AI, an expert in international trade compliance and document forensics.

Analyze this trade document and extract:
1. Document Type (Invoice, PO, Certificate, Bill of Lading, etc.)
2. Products with HS Codes (6-10 digits)
3. Origin Country & Destination Country
4. Security Analysis: tampering, handwriting, AI-generated detection
5. Required compliance documents for route ${options.fromCountry} → ${options.toCountry}

Return JSON:
{
  "extractedData": {
    "documentType": "string",
    "documentId": "string",
    "date": "string",
    "issuer": "string",
    "recipient": "string",
    "products": [{ "name": "string", "quantity": "string", "hsCode": "string", "isOrganic": boolean, "unitValue": "string" }],
    "originCountry": "string",
    "destinationCountry": "string"
  },
  "checklist": [
    { "name": "string", "description": "string", "issuingAgency": "string", "category": "string", "isMandatory": boolean }
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
