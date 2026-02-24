import { AnalysisOptions, AnalysisResult } from '../types';
import { BaseProvider } from './BaseProvider';

/**
 * Kimi (Moonshot AI) Provider - Excellent for Asian languages
 * API: https://api.moonshot.ai
 */
export class KimiProvider extends BaseProvider {
    name = 'Kimi';
    modelId = 'kimi-k2.5';
    
    constructor(apiKey: string) {
        super(apiKey, 'https://api.moonshot.ai/v1');
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
                        { type: 'image_url', image_url: { url: this.toDataUrl(mimeType, fileBase64) } }
                    ]
                }
            ],
            temperature: 0.0
        });
        
        const content = response.choices?.[0]?.message?.content;
        return this.parseResponse(content, options);
    }
    
    private buildPrompt(options: AnalysisOptions): string {
        return `你是 VeriPura AI，国际贸易合规专家。

分析此文档并提取：
1. 文档类型
2. 产品及HS编码
3. 原产国和目的国
4. 安全分析（篡改、真实性）
5. 从 ${options.fromCountry} 到 ${options.toCountry} 所需合规文件

请返回以下格式的JSON：
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

只返回有效的JSON。`;
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
