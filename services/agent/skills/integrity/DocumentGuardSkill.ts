
import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';
// @ts-ignore - LlamaIndex exports can be tricky, ignoring check for now to allow build
import { LlamaParseReader } from 'llama-cloud-services';

export class DocumentGuardSkill implements ISkill {
    public id = 'document_guard_skill';
    public name = 'Document Guard (Invoice Reconciler)';
    public category = SkillCategory.INTEGRITY;
    public description = 'Reconciles uploaded documents against the original consignment data using LlamaParse and Reasoning.';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { files, metadata } = context;

        // 1. Check for API Key
        let apiKey = '';
        try {
            // @ts-ignore
            apiKey = import.meta.env.VITE_LLAMA_CLOUD_API_KEY;
        } catch (e) {
            // Fallback for Node/Test environment
            // @ts-ignore
            apiKey = process.env.VITE_LLAMA_CLOUD_API_KEY || '';
        }

        if (!apiKey) {
            console.warn('[DocumentGuardSkill] Missing VITE_LLAMA_CLOUD_API_KEY');
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: true,
                verdict: 'UNKNOWN',
                errors: ['Missing VITE_LLAMA_CLOUD_API_KEY. Cannot parse document.'],
                auditLog: [{ timestamp: new Date().toISOString(), action: 'ERROR', details: 'Missing LlamaCloud API Key' }]
            };
        }

        // 2. Identify the file to check
        // Ideally we check the specific file triggering the event, if available in context params.
        // Fallback to the first file.
        const file = files && files[0];
        if (!file) {
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: false,
                verdict: 'UNKNOWN',
                auditLog: [{ timestamp: new Date().toISOString(), action: 'SKIPPED', details: 'No file provided in context' }]
            };
        }

        try {
            // 3. Parse Document (Reality)
            // LlamaParseReader in browser usually takes a blob/file or content.
            // Using generic handling here.
            const reader = new LlamaParseReader({ apiKey, resultType: "markdown" });

            // Convert file to Uint8Array for generic content loading
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Check if loadData works directly with data
            // If strictly node-fs dependent, we might need a workaround or just skip deep parsing for now.
            // But LlamaIndexTS supports browser usage. 
            const documents = await reader.loadDataAsContent(uint8Array, file.name);
            const parsedText = documents[0]?.text || "";

            if (!parsedText) {
                throw new Error("Failed to extract text from document.");
            }

            // 4. Construct "Truth" (Consignment Data)
            // We compare parsed text against known metadata
            const truth = {
                origin: metadata.shipment?.origin,
                product: metadata.shipment?.product,
            };

            // 5. Simple Validation Logic (Prototype)
            // This is the "One Step Forward, One Step Backward" check
            const issues: string[] = [];

            if (truth.origin && !parsedText.toLowerCase().includes(truth.origin.toLowerCase())) {
                issues.push(`Origin Mismatch: Document does not mention ${truth.origin}`);
            }
            if (truth.product && !parsedText.toLowerCase().includes(truth.product.toLowerCase())) {
                issues.push(`Product Mismatch: Document does not mention ${truth.product}`);
            }

            const verdict = issues.length > 0 ? 'WARNING' : 'COMPLIANT';

            return {
                success: issues.length === 0,
                confidence: 0.9,
                data: {
                    parsedContent: parsedText,
                    issues
                },
                requiresHumanReview: issues.length > 0,
                verdict,
                auditLog: [{
                    timestamp: new Date().toISOString(),
                    action: 'PARSE_COMPLETE',
                    details: issues.length > 0 ? `Issues found: ${issues.join(', ')}` : `Validated against ${truth.origin}/${truth.product}`
                }]
            };

        } catch (e: any) {
            console.error('[DocumentGuardSkill]', e);
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: true,
                verdict: 'UNKNOWN',
                errors: [e.message],
                auditLog: [{ timestamp: new Date().toISOString(), action: 'ERROR', details: `Parsing failed: ${e.message}` }]
            };
        }
    }
}
