import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';
import { REQUIRED_DOCS } from './requiredDocuments';

export class HalalKosherGuardian extends SubAgent {
    constructor() {
        super(
            'halal_kosher_guardian',
            'Halal & Kosher Guardian',
            'Verifies religious dietary compliance certificates.'
        );
    }

    public static shouldActivate(context: any): boolean {
        const attrs = context.attributes || [];
        return attrs.includes('Halal') || attrs.includes('Kosher');
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on religious certificate uploads or when shipment attributes specify Halal/Kosher
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE' || !!event.payload?.attributes;
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Religious compliance verification complete.";

        const isHalal = context.knowledgeGraph.facts.some(f => f.predicate === 'is_halal' && f.object === 'true') ||
            context.knowledgeGraph.facts.some(f => f.predicate === 'attribute' && f.object === 'Halal');
        const isKosher = context.knowledgeGraph.facts.some(f => f.predicate === 'is_kosher' && f.object === 'true') ||
            context.knowledgeGraph.facts.some(f => f.predicate === 'attribute' && f.object === 'Kosher');

        if (skills && (isHalal || isKosher)) {
            const relSkill = skills.get('religious_compliance');
            if (relSkill) {
                if (isHalal) {
                    const certBody = context.knowledgeGraph.facts.find(f => f.predicate === 'halal_certification_body')?.object;
                    if (certBody) {
                        const result = await relSkill.execute({ type: 'Halal', authority: certBody });
                        response += `\nHalal: ${result.message}`;
                        if (result.status === 'Warning') alerts.push({ severity: 'warning', message: result.message });
                    } else {
                        alerts.push({ severity: 'critical', message: 'Missing Halal Cert Body' });
                    }
                }
                if (isKosher) {
                    const auth = context.knowledgeGraph.facts.find(f => f.predicate === 'kosher_authority_detected')?.object;
                    if (auth) {
                        const result = await relSkill.execute({ type: 'Kosher', authority: auth });
                        response += `\nKosher: ${result.message}`;
                        if (result.status === 'Warning') alerts.push({ severity: 'warning', message: result.message });
                    }
                }
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
        return [...REQUIRED_DOCS.HALAL, ...REQUIRED_DOCS.KOSHER];
    }
}
