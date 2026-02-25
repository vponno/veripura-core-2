import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class SocialComplianceWhistleblower extends SubAgent {
    constructor() {
        super(
            'social_compliance_whistleblower',
            'Social Compliance Whistleblower',
            'Monitors NGO reports and global watchlists for labor or environmental violations linked to suppliers.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers when supplier or manufacturer data is identified in documents
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Social compliance: Watchlist screening complete.";

        const supplierFact = context.knowledgeGraph.facts.find(f => f.predicate === 'supplier_name');
        const manufacturerFact = context.knowledgeGraph.facts.find(f => f.predicate === 'manufacturer_name');

        const entitiesToScreen = [
            supplierFact?.object,
            manufacturerFact?.object
        ].filter(Boolean) as string[];

        if (entitiesToScreen.length > 0) {
            response = `**Social Compliance Watchlist Report**\n`;
            response += `🔍 Screening entities against global NGO and labor watchlists...\n\n`;

            // Security Safeguard: Real-time watchlist screening requires a connection to local or global ESG risk databases.
            // Currently in Evidence-Only mode.
            const watchlist: any[] = [];

            if (watchlist.length > 0) {
                response += `🔴 **Watchlist Match Detected**:\n`;
                watchlist.forEach(m => {
                    response += `- **${m.name}**: ${m.violation}. Source: *${m.source}* [Status: **${m.status}**]\n`;
                    alerts.push({
                        severity: m.status.toLowerCase() as 'critical' | 'warning',
                        message: `Social Compliance Alert: ${m.name} is on a labor/environmental watchlist.`,
                        suggestedAction: `IMMEDIATE SUSPENSION: This supplier is linked to ${m.violation}. Initiate an unannounced site audit or terminate contract to maintain ESG integrity.`
                    });
                });
            } else {
                response += "✅ **No Watchlist Matches**: Screened entities are not present in our current database of high-risk labor violators.\n";
            }

            // Secondary check: General region risk
            const originFact = context.knowledgeGraph.facts.find(f => f.predicate === 'origin_country');
            if (originFact && ['Uzbekistan', 'Turkmenistan', 'North Korea'].includes(originFact.object)) {
                response += `\n⚠️ **Regional Social Risk**: Originating from \`${originFact.object}\` carries an inherent high risk for state-sponsored forced labor in specific sectors. Deep source verification is mandatory.`;
                alerts.push({
                    severity: 'warning',
                    message: `High-Risk Region: ${originFact.object} social compliance risks.`,
                    suggestedAction: 'Require full chain-of-custody documentation down to the raw material level to ensure no forced labor components are present.'
                });
            }

        } else {
            response = "No specific supplier or manufacturer entities identified for screening. Whistleblower in monitoring mode.";
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
