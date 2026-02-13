import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class FoodSafetyAuditor extends SubAgent {
    constructor() {
        super(
            'food_safety_auditor',
            'Food Safety Auditor',
            'Evaluates general food safety compliance and document completeness.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Trigger on document uploads related to food safety or technical specs
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**Food Safety Audit Report**\n\n";

        // Logic: Scan for critical food safety certs in the knowledge graph
        const certs = context.knowledgeGraph.facts.filter(f => f.predicate === 'certification');

        const safetyCerts = ['HACCP', 'GMP', 'BRC', 'FSSC 22000', 'SQF', 'ISO 22000'];
        const detectedCerts = certs.filter(c => safetyCerts.some(s => c.object.includes(s)));

        if (detectedCerts.length > 0) {
            response += "✅ **Certifications Detected**:\n";
            for (const cert of detectedCerts) {
                const expiryFact = context.knowledgeGraph.facts.find(f => f.subject === cert.object && f.predicate === 'expiry_date');

                if (skills && expiryFact) {
                    const validator = skills.get('certificate_validator');
                    if (validator) {
                        const result = await validator.execute({
                            certName: cert.object,
                            expiryDate: expiryFact.object
                        });

                        response += `- **${cert.object}**: ${result.status === 'Expired' ? '❌ **EXPIRED**' : result.status === 'Expiring Soon' ? '⚠️ **Expiring soon**' : '✅ Valid'}\n`;

                        if (result.status === 'Expired') {
                            alerts.push({
                                severity: 'critical',
                                message: result.message,
                                suggestedAction: 'Request renewed certification from facility immediately.'
                            });
                        } else if (result.status === 'Expiring Soon') {
                            alerts.push({
                                severity: 'warning',
                                message: result.message,
                                suggestedAction: 'Start renewal process for this certification.'
                            });
                        }
                    }
                } else {
                    response += `- **${cert.object}**: Valid (Detailed check skipped - missing metadata)\n`;
                }
            }
        } else {
            response += "⚠️ **Warning**: No GFSI-recognized food safety certifications (HACCP, GMP, BRC, etc.) detected for this supplier.\n";
            alerts.push({
                severity: 'warning',
                message: 'Incomplete Food Safety Dossier.',
                suggestedAction: 'Verify if the facility is certified under HACCP, GMP, or a GFSI-recognized scheme.'
            });
        }

        // Specific logic for processed foods
        const productType = context.knowledgeGraph.facts.find(f => f.predicate === 'product_type')?.object || '';
        if (productType.toLowerCase().includes('processed') && !detectedCerts.some(c => c.object.includes('HACCP'))) {
            response += "\n❌ **Requirement Mismatch**: Processed food products strictly require a valid **HACCP** plan.";
            alerts.push({
                severity: 'critical',
                message: 'HACCP Mandatory for Processed Food.',
                suggestedAction: 'Facility must provide HACCP plan/certification for this consignment.'
            });
        }

        return {
            success: true,
            response,
            alerts
        };
    }

    private checkExpiryPhase(dateStr: string): string {
        try {
            const expiry = new Date(dateStr);
            const now = new Date();
            if (expiry < now) return "❌ **EXPIRED**";
            const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 30) return `⚠️ **Expiring soon** (${diffDays} days remaining)`;
            return "✅ Valid";
        } catch {
            return "Unknown";
        }
    }
}
