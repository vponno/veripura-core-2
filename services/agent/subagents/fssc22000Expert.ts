import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class FSSC22000Expert extends SubAgent {
    constructor() {
        super(
            'fssc_22000_expert',
            'FSSC 22000 System Expert',
            'Validates FSSC 22000 certification, which combines ISO 22000 with industry-specific PRPs.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return (context.attributes || []).includes('FSSC 22000');
    }

    canHandle(event: AgentEvent): boolean {
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**FSSC 22000 Compliance Report**\n\n";

        const fsscFact = context.knowledgeGraph.facts.find(f =>
            f.predicate === 'certification' && f.object.includes('FSSC 22000')
        );

        if (fsscFact) {
            response += `✅ **FSSC 22000 Verified**: This GFSI-benchmarked standard provides the highest level of food safety assurance.\n`;
            response += `📍 **Certificate ID**: ${fsscFact.object}\n`;

            const expiryFact = context.knowledgeGraph.facts.find(f =>
                f.subject === fsscFact.object && f.predicate === 'expiry_date'
            );
            if (skills) {
                const auditSkill = skills.get('food_safety_audit');
                if (auditSkill) {
                    const validation = await auditSkill.execute({
                        standard: 'FSSC 22000'
                    });
                    response += `✅ ${validation.message}\n`;
                }

                if (expiryFact) {
                    const validator = skills.get('certificate_validator');
                    if (validator) {
                        const result = await validator.execute({ certName: 'FSSC 22000', expiryDate: expiryFact.object });
                        if (result.status !== 'Pass') {
                            response += `⚠️ **Status**: ${result.message}\n`;
                        }
                    }
                }
            }
        } else {
            response += "ℹ️ **Note**: FSSC 22000 accreditation not found. (Often used as an alternative to BRC or SQF).\n";
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
