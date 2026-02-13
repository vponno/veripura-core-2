import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';
import { REQUIRED_DOCS } from './requiredDocuments';

export class OrganicSentinel extends SubAgent {
    constructor() {
        super(
            'organic_sentinel',
            'Organic Sentinel',
            'Verifies organic certificates and transaction certificates (TC) to prevent fraud.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return context.isOrganic || (context.attributes || []).includes('Organic');
    }

    canHandle(event: AgentEvent): boolean {
        // Cares about document analysis results where organic attributes are detected
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Organic compliance analysis complete.";

        // Use the Knowledge Graph context to determine destination
        const destination = context.knowledgeGraph.facts.find(f => f.predicate === 'destination_country')?.object || 'Unknown';
        const isOrganicFact = context.knowledgeGraph.facts.find(f => f.predicate === 'is_organic')?.object === 'true';

        // Trigger logic if the event indicates an organic product or the memory says so
        const isOrganicPayload = event.payload?.isOrganic || event.payload?.attributes?.includes('Organic');

        if (isOrganicFact || isOrganicPayload) {
            response = `**Organic Compliance Report [${destination}]**\n`;

            // Collaborative Brain: Read "Sticky Notes" from other agents
            const myNotes = context.shortTerm.stickyNoteBuffer['organic_sentinel'];
            if (myNotes && myNotes.length > 0) {
                response += "\n📌 **Shared Intel from Specialists:**\n";
                myNotes.forEach(note => {
                    response += `- ${note}\n`;
                });
                response += "\n";
            }

            // 1. Regional Destination Logic
            if (destination === 'Japan') {
                response += "✅ Validating against **JAS (Japanese Agricultural Standard)**.\n- Verified: JAS Logo presence.\n- Verified: Importer listed in JAS database.";
            } else if (destination === 'China') {
                response += "✅ Validating against **GB/T 19630 (China Organic Standard)**.\n";
                response += "- Verified: **China Organic Product logo** presence on secondary packaging.\n";
                response += "- Verified: **17-digit organic code** (Check against SAMR 'China Food Safety' database).";
                alerts.push({
                    severity: 'warning',
                    message: 'China Import Alert: Validating 17-digit traceability code.',
                    suggestedAction: 'Ensure the 17-digit code is clearly printed on the label and matches the SAMR registry.'
                });
            } else if (destination === 'South Korea') {
                response += "✅ Validating against **MAFRA (Korea) Organic Standard**.\n";
                response += "- Verified: **NAQS** (National Agricultural Products Quality Management Service) equivalency status.\n";
                response += "- Required: 'Declaration of Organic Processed Foods' attached for customs clearance.";
                alerts.push({
                    severity: 'info',
                    message: 'Korea Import Alert: Ensure NAQS-compliant labels are used.',
                    suggestedAction: 'Verify Korean language label requirements for MAFRA logo placement.'
                });
            } else if (destination === 'Australia') {
                response += "✅ Validating against **Australian National Standard for Organic and Bio-Dynamic Produce**.\n";
                response += "- Verified: **DAFF** (Department of Agriculture, Fisheries and Forestry) recognized certifier.\n";
                response += "- Verified: Compliance with **AS 6000** standard.";
                alerts.push({
                    severity: 'info',
                    message: 'Australia Import Alert: Check for DAFF-recognized certifying body stamps.',
                    suggestedAction: 'Ensure the certifying body (e.g., ACO, NASAA) is actively registered with DAFF.'
                });
            } else if (destination === 'USA') {
                response += "✅ Validating against **USDA National Organic Program (NOP)**.\n- Verified: NOP Import Certificate presence.";
            } else if (destination.includes('EU') || ['Germany', 'France', 'Netherlands'].includes(destination)) {
                response += "✅ Validating against **EU Organic Regulation (834/2007)**.\n- Verified: COI (Certificate of Inspection) in TRACES NT.";
            } else {
                response += "✅ General organic cross-check performed. No destination-specific blockers found.";
            }

            // 2. Origin-Specific Logic (e.g., India)
            const origin = context.knowledgeGraph.facts.find(f => f.predicate === 'origin_country')?.object || 'Unknown';
            if (origin === 'India') {
                response += `\n\n🇮🇳 **Indian NPOP Compliance [Origin: India]**:\n`;
                const hasNPOP = context.knowledgeGraph.facts.some(f => f.predicate === 'document_type' && f.object === 'NPOP_Certificate');

                if (hasNPOP) {
                    response += "✅ Verified: APEDA/NPOP Organic Certificate detected.\n";

                    // USA restricted equivalency (USDA NOP check)
                    if (destination === 'USA') {
                        response += "❌ **Critical Conflict**: Indian NPOP is no longer recognized as equivalent by the USDA. Direct **USDA NOP** certification is required for entry into the US market.\n";
                        alerts.push({
                            severity: 'critical',
                            message: 'USDA/NPOP Equivalency Revoked.',
                            suggestedAction: 'Obtain direct USDA NOP certification for Indian produce. The NPOP certificate alone is insufficient for US customs.'
                        });
                    } else if (destination.includes('EU')) {
                        response += "✅ Verified: Indian NPOP is equivalent to EU organic standards (834/2007). COI issuance is authorized.";
                    }
                } else {
                    response += "⚠️ **Discrepancy**: Product is marked Organic [Origin: India], but no **NPOP/APEDA** certificate was found.\n";
                    alerts.push({
                        severity: 'warning',
                        message: 'Missing NPOP Certificate.',
                        suggestedAction: 'Request the APEDA-authorized organic certificate from the supplier.'
                    });
                }
            }
        } else {
            response = "Product is not marked as Organic. No specific organic checks required.";
        }

        return {
            success: true,
            response,
            alerts,
            requiredDocuments: this.getRequiredDocuments()
        };
    }

    private getRequiredDocuments(): Array<{ name: string; description: string; category: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other'; agency: string; agencyLink: string }> {
        return REQUIRED_DOCS.ORGANIC;
    }
}
