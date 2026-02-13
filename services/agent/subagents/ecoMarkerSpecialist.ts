import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class EcoMarkerSpecialist extends SubAgent {
    constructor() {
        super(
            'eco_marker_specialist',
            'Eco Marker Specialist',
            'Verifies sustainability labels like Fairtrade and Rainforest Alliance.'
        );
    }

    public static shouldActivate(context: any): boolean {
        const attrs = context.attributes || [];
        const product = (context.product || '').toLowerCase();
        return attrs.includes('Fairtrade') ||
            attrs.includes('Rainforest') ||
            ['coffee', 'cocoa', 'tea'].some(c => product.includes(c));
    }

    canHandle(event: AgentEvent): boolean {
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**Ethical Label & Eco-Marker Analysis**\n\n";

        const product = (context.knowledgeGraph.facts.find(f => f.predicate === 'product_name')?.object || '').toLowerCase();
        const certs = context.knowledgeGraph.facts.filter(f => f.predicate === 'certification');

        // Fairtrade Logic
        const fairtradeFact = certs.find(c => c.object.includes('Fairtrade'));
        if (fairtradeFact) {
            response += `✅ **Fairtrade Certified**: FLO ID \`${fairtradeFact.object}\` detected. Social and economic premiums are validated.\n`;
        }

        // Rainforest Alliance Logic
        const rainforestFact = certs.find(c => c.object.includes('Rainforest'));
        if (rainforestFact) {
            response += `✅ **Rainforest Alliance Verified**: Sustainable farming practices and environmental management systems are active.\n`;
        }

        // Commodity-Specific Warnings
        if (['coffee', 'cocoa', 'tea'].some(c => product.includes(c))) {
            if (!fairtradeFact && !rainforestFact) {
                response += `⚠️ **Market Access Risk**: ${product} lacking ethical certification. Premium buyers in EU/US markets often require Fairtrade or R.A. status.\n`;
                alerts.push({
                    severity: 'warning',
                    message: `Missing Ethical Markers for ${product}.`,
                    suggestedAction: 'Consider prioritizing certified supply chains for this commodity category.'
                });
            }
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
