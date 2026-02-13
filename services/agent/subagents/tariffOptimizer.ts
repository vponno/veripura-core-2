import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class TariffOptimizer extends SubAgent {
    constructor() {
        super(
            'tariff_optimizer',
            'Tariff Optimizer (GSP/FTA)',
            'Proactively identifies Free Trade Agreements or GSP opportunities to reduce import duties.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on HS code, origin, or destination updates
        return event.type === 'ROUTE_UPDATE' || event.type === 'DOCUMENT_UPLOAD' || !!event.payload?.hsCode;
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**Financial Defense Report (Customs Duties)**\n\n";

        const origin = context.knowledgeGraph.facts.find(f => f.predicate === 'origin_country')?.object;
        const destination = context.knowledgeGraph.facts.find(f => f.predicate === 'destination_country')?.object;
        const hsCode = context.knowledgeGraph.facts.find(f => f.predicate === 'hs_code')?.object;
        const valueFact = context.knowledgeGraph.facts.find(f => f.predicate === 'declared_value');
        const value = valueFact ? parseFloat(valueFact.object) : 0;

        if (origin && destination && hsCode && skills) {
            response += `- Route: \`${origin}\` ➔ \`${destination}\`\n`;
            response += `- Commodity: \`HS ${hsCode}\`\n\n`;

            const tariffSkill = skills.get('tariff_optimizer');
            if (tariffSkill) {
                const result = await tariffSkill.execute({
                    product: 'Generic Product', // Context might need this if available
                    hsCode,
                    origin,
                    destination,
                    value
                });

                if (result.status === 'Pass') {
                    if (result.data?.savings) {
                        response += `💰 **Duty Saving Opportunity Identified!**\n`;
                        response += `- Trade Agreement: **${result.data.agreement}**\n`;
                        response += `- Base Duty: **${(result.data.baseRate * 100).toFixed(1)}%**\n`;
                        response += `- Optimized Duty: **${(result.data.dutyRate * 100).toFixed(1)}%**\n`;
                        response += `- Potential Savings: **$${result.data.savings.toFixed(2)}**\n`;
                        response += `- Requirement: **${result.data.requirement}**\n`;

                        alerts.push({
                            severity: 'info',
                            message: `Duty Optimization: ${result.data.agreement} saves $${result.data.savings.toFixed(2)}.`,
                            suggestedAction: `Ensure the exporter provides a valid ${result.data.requirement}.`
                        });
                    } else {
                        response += `ℹ️ **Standard Duty Applied**: ${(result.data.dutyRate * 100).toFixed(1)}% (MFN). No preferential agreement active.\n`;
                    }
                } else if (result.status === 'Warning') {
                    response += `⚠️ **Optimization Warning**: ${result.data?.agreement || 'Agreement'} is revoked or negotiating.\n`;
                }
            } else {
                response += "⚠️ Skill `tariff_optimizer` not found in registry.";
            }

        } else {
            response += "ℹ️ **Analysis Pending**: Full HS code and route data required for duty calculation.";
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
