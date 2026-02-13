import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';
import { REQUIRED_DOCS } from './requiredDocuments';

export class HACCPSpecialist extends SubAgent {
    constructor() {
        super(
            'haccp_specialist',
            'HACCP Specialist',
            'Verifies Hazard Analysis Critical Control Point (HACCP) planning and execution.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return (context.attributes || []).includes('HACCP');
    }

    canHandle(event: AgentEvent): boolean {
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**HACCP Compliance Report**\n\n";

        const productType = context.knowledgeGraph.facts.find(f => f.predicate === 'product_type')?.object || '';
        const isProcessed = productType.toLowerCase().includes('processed') || productType.toLowerCase().includes('ready-to-eat');

        const haccpFact = context.knowledgeGraph.facts.find(f =>
            f.predicate === 'certification' && f.object.includes('HACCP')
        );

        if (haccpFact) {
            response += `✅ **HACCP Plan Verified**: ${haccpFact.object} is active for this facility.\n`;

            const ccpFact = context.knowledgeGraph.facts.find(f => f.predicate === 'ccp_validation');

            if (skills) {
                const auditSkill = skills.get('food_safety_audit');
                if (auditSkill) {
                    const validation = await auditSkill.execute({
                        standard: 'HACCP',
                        ccpValidationDate: ccpFact?.object
                    });

                    response += `🔍 ${validation.message}\n`;

                    if (validation.status !== 'Pass') {
                        alerts.push({
                            severity: 'warning',
                            message: validation.message,
                            suggestedAction: 'Ensure latest CCP monitoring logs are available for inspection.'
                        });
                    }
                }
            }
        } else {
            if (isProcessed) {
                response += "❌ **CRITICAL**: HACCP plan is MANDATORY for processed/high-risk products. No active HACCP plan found.\n";
                alerts.push({
                    severity: 'critical',
                    message: `HACCP Missing for ${productType}.`,
                    suggestedAction: 'Block consignment until the facility provides its HACCP accreditation and critical control point map.'
                });
            } else {
                response += "⚠️ **Recommendation**: While not strictly mandatory for all raw agricultural products, a voluntary HACCP plan improves market access.\n";
                alerts.push({
                    severity: 'info',
                    message: 'HACCP not detected.',
                    suggestedAction: 'Verify if the producer follows HACCP-based principles even if not certified.'
                });
            }
        }

        return {
            success: true,
            response,
            alerts,
            requiredDocuments: this.getRequiredDocuments()
        };
    }

    private getRequiredDocuments(): Array<{ name: string; description: string; category: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other'; agency: string; agencyLink: string }> {
        return REQUIRED_DOCS.HACCP;
    }
}
