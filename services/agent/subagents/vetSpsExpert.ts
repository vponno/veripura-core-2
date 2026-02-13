import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';
import { REQUIRED_DOCS } from './requiredDocuments';

export class VetSpsExpert extends SubAgent {
    constructor() {
        super(
            'vet_sps_expert',
            'Veterinary & SPS Expert',
            'Ensures compliance with Sanitary and Phytosanitary measures for animal and plant products.'
        );
    }

    public static shouldActivate(context: any): boolean {
        const productLower = (context.product || '').toLowerCase();
        return productLower.includes('meat') || productLower.includes('beef');
    }

    canHandle(event: AgentEvent): boolean {
        // Handles product classification or health certificate uploads
        return event.type === 'DOCUMENT_UPLOAD' || (event.type === 'ROUTE_UPDATE' && !!event.payload?.product);
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Vet/SPS analysis complete.";

        // Logic: Look for 'Meat' or 'Plant' keywords in product description from Memory
        // For now, simple mock payload check
        const product = event.payload?.product || '';

        if (product.toLowerCase().includes('meat') || product.toLowerCase().includes('beef')) {
            alerts.push({
                severity: 'warning',
                message: 'SPS Alert: Animal product detected. Veterinary Health Certificate is MANDATORY.',
                suggestedAction: 'Verify VHC document is present and valid.'
            });
            response = "Vet/SPS: Flagged animal product requirement.";
        }

        return {
            success: true,
            response,
            alerts,
            requiredDocuments: this.getRequiredDocuments()
        };
    }

    private getRequiredDocuments(): Array<{ name: string; description: string; category: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other'; agency: string; agencyLink: string }> {
        return REQUIRED_DOCS.SANITARY;
    }
}
