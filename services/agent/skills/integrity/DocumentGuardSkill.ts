
import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';
import { functions } from '../../../lib/firebase';
import { httpsCallable } from 'firebase/functions';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g. "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

export class DocumentGuardSkill implements ISkill {
    public id = 'document_guard_skill';
    public name = 'Document Guard (Invoice Reconciler)';
    public category = SkillCategory.INTEGRITY;
    public description = 'Reconciles uploaded documents against the original consignment data using LlamaParse and Reasoning.';

    async execute(context: SkillContext): Promise<SkillResult> {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [DocumentGuardSkill] EXECUTING (via Backend)               ║');
        console.log('╚════════════════════════════════════════════════════════════╝');

        const { files, metadata } = context;

        // Identify the file to check
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

        try {
            console.log('[DocumentGuardSkill] Converting file to base64...');
            const base64 = await fileToBase64(file);

            console.log('[DocumentGuardSkill] Calling backend parseDocument...');
            const parseDocumentFn = httpsCallable(functions, 'parseDocument');
            const response = await parseDocumentFn({
                base64,
                fileName: file.name
            });

            const result = response.data as any;
            const parsedText = result.markdown;

            if (!parsedText) {
                throw new Error("Failed to extract text from document via backend.");
            }

            console.log('[DocumentGuardSkill] ✓ Extracted', parsedText.length, 'characters');

            // 4. Construct "Truth" (Consignment Data)
            const truth = {
                origin: metadata.shipment?.origin,
                destination: metadata.shipment?.destination,
                product: metadata.shipment?.product,
            };

            // 5. Simple Validation Logic
            const issues: string[] = [];

            if (truth.origin && !parsedText.toLowerCase().includes(truth.origin.toLowerCase())) {
                issues.push(`Origin Mismatch: Document does not mention ${truth.origin}`);
            }
            if (truth.destination && !parsedText.toLowerCase().includes(truth.destination.toLowerCase())) {
                issues.push(`Destination Mismatch: Document does not mention ${truth.destination}`);
            }
            if (truth.product && !parsedText.toLowerCase().includes(truth.product.toLowerCase())) {
                issues.push(`Product Mismatch: Document does not mention ${truth.product}`);
            }

            const verdict = issues.length > 0 ? 'WARNING' : 'COMPLIANT';

            console.log('╔════════════════════════════════════════════════════════════╗');
            console.log(`║ [DocumentGuardSkill] RESULT: ${verdict.padEnd(44)}║`);
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
