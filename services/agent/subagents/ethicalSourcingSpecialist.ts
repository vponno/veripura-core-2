import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';
import { REQUIRED_DOCS } from './requiredDocuments';

export class EthicalSourcingSpecialist extends SubAgent {
    constructor() {
        super(
            'ethical_sourcing_specialist',
            'Ethical Sourcing Specialist',
            'Validates social compliance and environmental certs (Fairtrade, Rainforest Alliance, BSCI).'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Trigger on document uploads related to social compliance certificates
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**Ethical Sourcing & Social Compliance Report**\n\n";

        // Logic: Scan for ethical and social certs
        const certs = context.knowledgeGraph.facts.filter(f => f.predicate === 'certification');

        const ethicalCerts = ['Fairtrade', 'Rainforest Alliance', 'BSCI', 'Sedex', 'SA8000'];
        const detectedCerts = certs.filter(c => ethicalCerts.some(s => c.object.includes(s)));

        if (detectedCerts.length > 0) {
            response += "✅ **Ethical Certifications Detected**:\n";
            for (const cert of detectedCerts) {
                const ratingFact = context.knowledgeGraph.facts.find(f => f.subject === cert.object && f.predicate === 'audit_score');

                if (skills) {
                    const auditor = skills.get('ethical_audit');
                    if (auditor) {
                        const result = await auditor.execute({
                            standard: cert.object.includes('BSCI') ? 'BSCI' :
                                cert.object.includes('Fairtrade') ? 'Fairtrade' :
                                    cert.object.includes('Rainforest') ? 'Rainforest Alliance' : 'Sedex',
                            score: ratingFact?.object
                        });

                        response += `- **${cert.object}**: ${result.status === 'Pass' ? '✅ Pass' : '⚠️ Warning'} (${result.data?.scoreLabel || 'N/A'})\n`;

                        if (result.status !== 'Pass') {
                            alerts.push({
                                severity: 'warning',
                                message: result.message,
                                suggestedAction: 'Request site improvement plan or alternative supplier audit.'
                            });
                        }
                    }
                } else {
                    response += `- **${cert.object}**: Validated\n`;
                }
            }
        } else {
            response += "⚠️ **Alert**: No ethical or social compliance certifications (Fairtrade, BSCI, etc.) detected for this supplier.\n";
            alerts.push({
                severity: 'info',
                message: 'No social compliance data found.',
                suggestedAction: 'Inquire if the supplier holds BSCI, Sedex, or similar social audit reports.'
            });
        }

        // Logic for specific commodities (e.g., Coffee, Cocoa)
        const product = (context.knowledgeGraph.facts.find(f => f.predicate === 'product_name')?.object || '').toLowerCase();
        const highRiskCommodities = ['coffee', 'cocoa', 'tea', 'cotton'];

        if (highRiskCommodities.some(item => product.includes(item)) && detectedCerts.length === 0) {
            response += `\n❗ **Market Access Risk**: ${product} is a high-risk commodity for labor violations. **Fairtrade** or **Rainforest Alliance** certification is highly recommended for premium market entry.`;
            alerts.push({
                severity: 'warning',
                message: `ESG Vulnerability: ${product} lacking ethical certification.`,
                suggestedAction: 'Consider prioritizing certified batches for this commodity.'
            });
        }

        return {
            success: true,
            response,
            alerts,
            requiredDocuments: this.getRequiredDocuments()
        };
    }

    private getRequiredDocuments(): Array<{ name: string; description: string; category: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other'; agency: string; agencyLink: string }> {
        return REQUIRED_DOCS.ETHICAL;
    }
}
