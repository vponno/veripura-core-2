import { ISkill, SkillCategory, SkillContext, SkillResult } from '../types.ts';
import { ModelRegistry } from '../ModelRegistry.ts';

// Mocking external library calls for now
async function callHuggingFace(modelId: string, image: any): Promise<any> {
    // Simulator for HF Inference Endpoint
    console.log(`[FlexOCR] Calling Hugging Face Model: ${modelId}`);
    await new Promise(r => setTimeout(r, 1500));
    return { text: "Simulated Qwen2.5-VL Output: Invoice #12345, Total: $500.00", tables: [] };
}

async function callDocling(file: any): Promise<any> {
    // Simulator for Docling/PaddleOCR
    console.log(`[FlexOCR] Calling Docling Parser`);
    await new Promise(r => setTimeout(r, 500));
    return { markdown: "# Invoice 12345\n\n| Item | Cost |\n|---|---|\n| Widget | 500 |" };
}

export class DocumentAnalysisSkill implements ISkill {
    public id = 'document_analysis_skill';
    public name = 'Document Analysis (Flex OCR)';
    public category = SkillCategory.META; // Or INTEGRITY
    public description = 'Analyzes documents using a flexible routing engine (Qwen2.5-VL for complex, Docling for structure).';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { files, metadata } = context;
        const modelRegistry = ModelRegistry.getInstance();

        // 1. Determine Routing Strategy
        const preferredModel = context.preferredModel || 'auto';
        const ocrMode = context.ocrMode || 'auto';
        const hasFiles = files && files.length > 0;

        if (!hasFiles && !context.metadata.textContent) {
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: true,
                errors: ['No files or text content provided'],
                auditLog: []
            };
        }

        // 2. Select Model Config
        let selectedModel = modelRegistry.get('default');
        if (preferredModel !== 'auto') {
            selectedModel = modelRegistry.get(preferredModel);
        } else if (ocrMode === 'accurate' || this.isComplexDocument(metadata.documentType)) {
            selectedModel = modelRegistry.resolveForTask('ocr'); // Should return Qwen2.5-VL
        }

        // 3. Execute "Flex OCR"
        console.log(`[DocumentAnalysis] Routing to ${selectedModel?.provider} / ${selectedModel?.modelId}`);

        let resultData;

        if (selectedModel?.modelId.includes('Qwen') || selectedModel?.modelId.includes('vision')) {
            // Route to Vision-Language Model
            resultData = await callHuggingFace(selectedModel.modelId, files[0]);
        } else if (selectedModel?.modelId.includes('docling')) {
            // Route to Structural Parser
            resultData = await callDocling(files[0]);
        } else {
            // Fallback or simple keyword search (legacy logic)
            resultData = { text: "Legacy Keyword Match" };
        }

        return {
            success: true,
            confidence: 0.95,
            data: {
                extracted: resultData,
                engine: selectedModel?.modelId,
                mode: ocrMode
            },
            requiresHumanReview: false,
            verdict: 'COMPLIANT', // Information only
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'OCR_COMPLETE',
                details: `Processed via ${selectedModel?.modelId}`
            }]
        };
    }

    async validateContext(context: SkillContext): Promise<boolean> {
        return (!!context.files && context.files.length > 0) || !!context.metadata.textContent;
    }

    private isComplexDocument(type?: string): boolean {
        if (!type) return false;
        const complexTypes = ['invoice', 'certificate', 'bill_of_lading', 'lab_report'];
        return complexTypes.includes(type.toLowerCase());
    }
}
