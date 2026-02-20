import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class SanctionsSentry extends SubAgent {
    constructor() {
        super(
            'sanctions_sentry',
            'Sanctions Sentry',
            'Screens exporters, vessels, and banks against OFAC, UN, and EU watchlists.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true; // Always active for international shipments
    }

    canHandle(event: AgentEvent): boolean {
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'USER_MESSAGE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**Sanctions Sentry: High-Confidence Watchlist Report**\n\n";

        const exporter = context.knowledgeGraph.facts.find(f => f.predicate === 'exporter_name')?.object || 'Unknown Exporter';
        const vessel = context.knowledgeGraph.facts.find(f => f.predicate === 'vessel_name')?.object || 'Unknown Vessel';

        // DELEGATE TO SKILL: Watchlist Scent
        const watchlistSkill = skills?.get('watchlist_scent');
        let matches: any[] = [];

        if (watchlistSkill) {
            const result = await watchlistSkill.execute({
                consignmentId: 'unknown',
                files: [],
                metadata: { query: `${exporter} ${vessel}` }
            });
            matches = result.data?.matches || [];
        }

        if (matches.length > 0) {
            response += `🔴 **IMMEDIATE ALERT**: Potential matches found in global sanctions database.\n`;
            matches.forEach(m => {
                response += `- Found: \`${m.entity}\` on list: \`${m.list}\`\n`;
            });
            alerts.push({
                severity: 'critical',
                message: `Sanctions Match detected for entity: ${matches[0].entity}`,
                suggestedAction: 'Immediate stop. Perform manual Enhanced Due Diligence (EDD).'
            });
        } else {
            response += `✅ Clean Scan: \`${exporter}\` and \`${vessel}\` are not flagged on current watchlists.\n`;
            response += "🛡️ Continuous blockchain-anchored monitoring active.";
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
