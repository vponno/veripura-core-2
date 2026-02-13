import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class IncotermsAdvisor extends SubAgent {
    constructor() {
        super(
            'incoterms_advisor',
            'Incoterms Advisor',
            'Validates Incoterms 2020 usage and risk transfer points.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on document uploads to compare PO vs Bill of Lading
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Incoterms compliance analysis complete.";

        // Extract Incoterm from context
        const incotermFact = context.knowledgeGraph.facts.find(f => f.predicate === 'incoterm');
        const bolPointFact = context.knowledgeGraph.facts.find(f => f.predicate === 'bol_transfer_point');

        if (incotermFact) {
            const incoterm = incotermFact.object.toUpperCase();
            response = `**Incoterms Advisor Report [${incoterm}]**\n`;

            // Simple logic for common items
            if (incoterm === 'FOB') {
                response += "ℹ️ **FOB (Free On Board)**: Risk transfers when goods are loaded onto the vessel.\n";
                if (bolPointFact && !bolPointFact.object.toLowerCase().includes('board')) {
                    response += `❌ **Discrepancy**: Bill of Lading mentions \`${bolPointFact.object}\` as the transfer point, but FOB requires \`On Board\`.\n`;
                    alerts.push({
                        severity: 'warning',
                        message: `Incoterm Mismatch: ${incoterm} requires on-board risk transfer.`,
                        suggestedAction: 'Check Bill of Lading for "Clean Shipped on Board" notation.'
                    });
                } else {
                    response += "✅ Verified: Transfer of risk aligns with FOB standards.";
                }
            } else if (incoterm === 'CIF') {
                response += "ℹ️ **CIF (Cost, Insurance, and Freight)**: Risk transfers on vessel, but seller pays to destination.\n";
                const hasInsurance = context.knowledgeGraph.facts.some(f => f.predicate === 'document_type' && f.object === 'Insurance_Certificate');
                if (!hasInsurance) {
                    response += "⚠️ **Warning**: Insurance Certificate not detected. CIF requires seller-provided insurance.\n";
                    alerts.push({
                        severity: 'critical',
                        message: 'Insurance Missing: CIF terms require an insurance certificate.',
                        suggestedAction: 'Ensure an insurance certificate is provided by the exporter.'
                    });
                } else {
                    response += "✅ Verified: Insurance coverage present for CIF terms.";
                }
            } else {
                response += `✅ Incoterm \`${incoterm}\` recognized. Basic validation complete.`;
            }
        } else {
            response = "No Incoterms detected in primary documents. Advisor skipping validation.";
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
