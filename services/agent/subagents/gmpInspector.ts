import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class GMPInspector extends SubAgent {
    constructor() {
        super(
            'gmp_inspector',
            'GMP Inspector',
            'Audits Good Manufacturing Practices (GMP) adherence.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return (context.attributes || []).includes('GMP');
    }

    canHandle(event: AgentEvent): boolean {
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**GMP Hygiene & Safety Report**\n\n";

        const gmpFact = context.knowledgeGraph.facts.find(f =>
            f.predicate === 'certification' && f.object.includes('GMP')
        );

        if (gmpFact) {
            response += `✅ **GMP Certification Detected**: ${gmpFact.object}.\n`;
            response += "Foundational hygiene prerequisites (PRPs) are established.\n";
        } else {
            response += "⚠️ **Warning**: No Good Manufacturing Practices (GMP) certification detected.\n";
            alerts.push({
                severity: 'warning',
                message: 'GMP Certification Missing.',
                suggestedAction: 'Verify the facility has foundational hygiene and prerequisite programs documented.'
            });
        }

        // Secondary check for facility hygiene facts
        const auditObservation = context.knowledgeGraph.facts.find(f => f.predicate === 'audit_observation' && f.object.includes('Hygiene'));
        if (auditObservation) {
            response += `\n📝 **Last Audit Note**: ${auditObservation.object}\n`;
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
