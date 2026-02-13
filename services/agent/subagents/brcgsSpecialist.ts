import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class BRCGSSpecialist extends SubAgent {
    constructor() {
        super(
            'brcgs_specialist',
            'BRCGS Specialist',
            'Verifies British Retail Consortium Global Standards for Food Safety.'
        );
    }

    public static shouldActivate(context: any): boolean {
        const attrs = context.attributes || [];
        return attrs.includes('BRC') || attrs.includes('BRCGS');
    }

    canHandle(event: AgentEvent): boolean {
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**BRCGS Food Safety Audit Report**\n\n";

        // Logic: Focus specifically on BRC/BRCGS certs
        const brcFact = context.knowledgeGraph.facts.find(f =>
            f.predicate === 'certification' &&
            (f.object.includes('BRC') || f.object.includes('BRCGS'))
        );

        if (brcFact) {
            const gradeFact = context.knowledgeGraph.facts.find(f =>
                f.subject === brcFact.object && f.predicate === 'audit_grade'
            );
            const grade = (gradeFact?.object || 'Unknown').toUpperCase();

            response += `✅ **BRCGS Certification Detected**: ${brcFact.object}\n`;
            response += `📊 **Audit Grade**: ${grade}\n\n`;

            if (skills) {
                const auditSkill = skills.get('food_safety_audit');
                if (auditSkill) {
                    const validation = await auditSkill.execute({
                        standard: 'BRCGS',
                        grade
                    });

                    response += `${validation.message}\n`;

                    if (validation.status !== 'Pass') {
                        alerts.push({
                            severity: validation.status === 'Fail' ? 'critical' : 'warning',
                            message: `BRCGS Compliance Alert: ${validation.message}`,
                            suggestedAction: 'Request the full audit report to review non-conformities and corrective action evidence.'
                        });
                    }
                }
            }

            // Check Expiry (via existing skill if available)
            const expiryFact = context.knowledgeGraph.facts.find(f =>
                f.subject === brcFact.object && f.predicate === 'expiry_date'
            );
            if (skills && expiryFact) {
                const validator = skills.get('certificate_validator');
                if (validator) {
                    const result = await validator.execute({
                        certName: brcFact.object,
                        expiryDate: expiryFact.object
                    });
                    if (result.status === 'Expired') {
                        response += `❌ **Status**: EXPIRED (${expiryFact.object})\n`;
                        alerts.push({
                            severity: 'critical',
                            message: `BRCGS Certificate for ${brcFact.object} has expired.`,
                            suggestedAction: 'Suspend loading until a valid BRCGS certificate is provided.'
                        });
                    }
                }
            }
        } else {
            response += "⚠️ **Alert**: No BRCGS certification detected. Global retailers often mandate BRCGS/GFSI for high-risk food categories.\n";
            alerts.push({
                severity: 'info',
                message: 'BRCGS certification missing.',
                suggestedAction: 'Inquire if the facility holds BRCGS certification for GFSI-level trust.'
            });
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
