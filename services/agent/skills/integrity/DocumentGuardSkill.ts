
import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';
import { LlamaCloud } from '@llamaindex/llama-cloud';
import { toFile } from '@llamaindex/llama-cloud/core/uploads.js';

export class DocumentGuardSkill implements ISkill {
    public id = 'document_guard_skill';
    public name = 'Document Guard (Invoice Reconciler)';
    public category = SkillCategory.INTEGRITY;
    public description = 'Reconciles uploaded documents against the original consignment data using LlamaParse and Reasoning.';

    async execute(context: SkillContext): Promise<SkillResult> {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [DocumentGuardSkill] EXECUTING                             ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        
        const { files, metadata } = context;

        console.log('[DocumentGuardSkill] Context received:', {
            hasFiles: !!files && files.length > 0,
            fileCount: files?.length || 0,
            metadataKeys: Object.keys(metadata || {})
        });

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
            console.warn('╔════════════════════════════════════════════════════════════╗');
            console.warn('║ [DocumentGuardSkill] ⚠️ MISSING API KEY                    ║');
            console.warn('╚════════════════════════════════════════════════════════════╝');
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

        console.log('[DocumentGuardSkill] ✓ LlamaCloud API Key found');

        // 2. Identify the file to check
        // Ideally we check the specific file triggering the event, if available in context params.
        // Fallback to the first file.
        const file = files && files[0];
        if (!file) {
            console.warn('[DocumentGuardSkill] ⚠️ No file provided in context');
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: false,
                verdict: 'UNKNOWN',
                auditLog: [{ timestamp: new Date().toISOString(), action: 'SKIPPED', details: 'No file provided in context' }]
            };
        }

        console.log('[DocumentGuardSkill] ✓ File found:', file.name, `(${file.size} bytes)`);

        try {
            console.log('[DocumentGuardSkill] Initializing LlamaCloud client...');
            const client = new LlamaCloud({ apiKey });
            console.log('[DocumentGuardSkill] ✓ LlamaCloud client initialized');

            // Convert file to Uint8Array for generic content loading
            const arrayBuffer = await file.arrayBuffer();
            const uploadFile = await toFile(arrayBuffer, file.name || 'document.pdf');
            console.log('[DocumentGuardSkill] ✓ File converted to upload format');

            // Parse document directly using the new SDK
            console.log('[DocumentGuardSkill] Sending to LlamaCloud for parsing...');
            const jobResult = await client.parsing.parse({
                upload_file: uploadFile,
                tier: 'cost_effective',
                version: 'latest',
                expand: ['markdown']
            });
            
            console.log('[DocumentGuardSkill] ✓ LlamaCloud parsing complete');
            console.log('[DocumentGuardSkill] Response:', JSON.stringify(jobResult, null, 2).substring(0, 500) + '...');

            // @ts-ignore
            const parsedText = jobResult.markdown_full || jobResult.markdown?.pages?.map(p => p.markdown || "").join("\n") || "";

            if (!parsedText) {
                throw new Error("Failed to extract text from document.");
            }

            console.log('[DocumentGuardSkill] ✓ Extracted', parsedText.length, 'characters');

            // 4. Construct "Truth" (Consignment Data)
            // We compare parsed text against known metadata
            const truth = {
                origin: metadata.shipment?.origin,
                product: metadata.shipment?.product,
            };

            console.log('[DocumentGuardSkill] Truth data for validation:', truth);

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
            
            console.log('╔════════════════════════════════════════════════════════════╗');
            console.log(`║ [DocumentGuardSkill] RESULT: ${verdict.padEnd(44)}║`);
            if (issues.length > 0) {
                console.log(`║ Issues: ${(issues.join(', ')).substring(0, 40).padEnd(44)}║`);
            }
            console.log('╚════════════════════════════════════════════════════════════╝');

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
            console.error('╔════════════════════════════════════════════════════════════╗');
            console.error('║ [DocumentGuardSkill] ❌ ERROR                             ║');
            console.error('╚════════════════════════════════════════════════════════════╝');
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
