import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class BSCIAuditor extends SubAgent {
    constructor() {
        super(
            'bsci_auditor',
            'BSCI Auditor',
            'Verifies Business Social Compliance Initiative (BSCI) audit reports and grades.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return (context.attributes || []).includes('BSCI');
    }

    canHandle(event: AgentEvent): boolean {
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**amfori BSCI Social Audit Report**\n\n";

        const bsciFact = context.knowledgeGraph.facts.find(f =>
            f.predicate === 'certification' && f.object.includes('BSCI')
        );

        if (bsciFact) {
            const resultFact = context.knowledgeGraph.facts.find(f =>
                f.subject === bsciFact.object && f.predicate === 'audit_result'
            );
            const score = (resultFact?.object || 'Unknown').toUpperCase();

            response += `✅ **BSCI Audit Detected**: ${bsciFact.object}\n`;
            response += `🏷️ **Overall Rating**: ${score}\n\n`;

            if (skills) {
                const ethicalSkill = skills.get('ethical_audit');
                if (ethicalSkill) {
                    const validation = await ethicalSkill.execute({
                        standard: 'BSCI',
                        score
                    });

                    response += `${validation.message}\n`;

                    if (validation.status !== 'Pass') {
                        alerts.push({
                            severity: 'warning',
                            message: `Inadequate BSCI Rating: ${score}.`,
                            suggestedAction: 'Verify if a remediation plan is in place for the identified Performance Areas (PAs).'
                        });
                    }
                }
            }

            // Check for critical PAs if mentioned in facts
            const childLaborFact = context.knowledgeGraph.facts.find(f => f.predicate === 'violation' && f.object.includes('Child Labor'));
            if (childLaborFact) {
                response += `🛑 **CRITICAL**: Potential Child Labor violation mentioned in audit references.\n`;
                alerts.push({
                    severity: 'critical',
                    message: 'Zero Tolerance issue identified in social audit.',
                    suggestedAction: 'Immediately trigger the Zero Tolerance protocol and engage a third-party investigator.'
                });
            }

        } else {
            response += "⚠️ **Alert**: No amfori BSCI or equivalent social audit detected.\n";
            alerts.push({
                severity: 'info',
                message: 'Social audit data missing.',
                suggestedAction: 'Request latest BSCI or Sedex SMETA audit report to verify labor conditions.'
            });
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
