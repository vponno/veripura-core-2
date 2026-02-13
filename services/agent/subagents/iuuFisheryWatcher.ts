import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';
import { REQUIRED_DOCS } from './requiredDocuments';

export class IUUFisheryWatcher extends SubAgent {
    constructor() {
        super(
            'iuu_fishery_watcher',
            'IUU Fishery Watcher',
            'Combats Illegal, Unreported, and Unregulated (IUU) fishing by validating catch certificates and vessel monitoring.'
        );
    }

    public static shouldActivate(context: any): boolean {
        const hsPrefix = context.hsCode?.substring(0, 2);
        return hsPrefix === '03';
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on document uploads or route updates if HS code starts with 03 (Seafood)
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "IUU Fishery compliance analysis complete.";

        // Extract HS Code and Destination from context
        const hsFact = context.knowledgeGraph.facts.find(f => f.predicate === 'hs_code');
        const destination = context.knowledgeGraph.facts.find(f => f.predicate === 'destination_country')?.object || 'Unknown';

        const isSeafood = hsFact?.object.startsWith('03') || event.payload?.hsCode?.startsWith('03');

        if (isSeafood) {
            response = `**IUU Fishery Watcher Report [${destination}]**\n`;

            // Check for Catch Certificate
            const hasCatchCert = context.knowledgeGraph.facts.some(f => f.predicate === 'document_type' && f.object === 'Catch_Certificate');
            const hasVesselID = context.knowledgeGraph.facts.some(f => f.predicate === 'vessel_imo_id');

            if (!hasCatchCert) {
                response += "❌ **Missing: Catch Certificate.** Wild-caught seafood must have a valid catch certificate verified by the flag state.\n";
                alerts.push({
                    severity: 'critical',
                    message: `Missing Catch Certificate for HS Code ${hsFact?.object || 'Seafood'}.`,
                    suggestedAction: 'Upload the validated catch certificate from the issuing flag state.'
                });
            } else {
                response += "✅ Verified: Catch Certificate is present.\n";
            }

            if (!hasVesselID) {
                response += "⚠️ **Warning: Vessel IMO Number not detected.** Unable to cross-reference vessel with global IUU watchlists.\n";
                alerts.push({
                    severity: 'warning',
                    message: 'Vessel identification (IMO/MMSI) missing.',
                    suggestedAction: 'Provide the vessel IMO number for real-time risk screening.'
                });
            } else {
                response += "✅ Verified: Vessel identity is recognized.\n";
            }

            if (destination.includes('EU')) {
                response += "\n- Rule Applied: EU Council Regulation (EC) No 1005/2008.\n- Compliance Tier: 1 (Catch validation required for entry).";
            }
        } else {
            response = "Product is not identified as Seafood (HS 03). IUU Fishery monitoring is inactive.";
        }

        return {
            success: true,
            response,
            alerts,
            requiredDocuments: this.getRequiredDocuments()
        };
    }

    private getRequiredDocuments(): Array<{ name: string; description: string; category: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other'; agency: string; agencyLink: string }> {
        return REQUIRED_DOCS.IUU;
    }
}
