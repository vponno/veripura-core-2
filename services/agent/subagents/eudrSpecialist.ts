import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';
import { v4 as uuidv4 } from 'uuid';
import { REQUIRED_DOCS } from './requiredDocuments';

export class EUDRSpecialist extends SubAgent {
    constructor() {
        super(
            'eudr_specialist',
            'EU Deforestation Regulation Specialist',
            'Analyzes geolocation data and product types to ensure compliance with EUDR.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return context.destination === 'Netherlands' || context.destination?.includes('EU');
    }

    canHandle(event: AgentEvent): boolean {
        // This specialist cares about Document Uploads (looking for plot coordinates)
        // or specific Compliance Check events.
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "EUDR verification pending.";

        // DELEGATE TO SKILL: Regulatory Check
        if (skills) {
            const regSkill = skills.get('regulatory_check');
            if (regSkill) {
                // Extract context for the skill
                const productFact = context.knowledgeGraph.facts.find(f => f.predicate === 'product_name');
                const geoFact = context.knowledgeGraph.facts.find(f => f.predicate === 'geolocation_coordinates');
                const deforestFact = context.knowledgeGraph.facts.find(f => f.predicate === 'deforestation_free');

                const result = await regSkill.execute({
                    regulation: 'EUDR',
                    context: {
                        product: productFact?.object || '',
                        geolocation: geoFact?.object,
                        deforestationFree: deforestFact?.object === 'true'
                    }
                });

                response = result.message;

                if (result.status === 'Fail') {
                    alerts.push({
                        severity: 'critical',
                        message: result.message,
                        suggestedAction: 'Ensure geolocation data is provided and verified.'
                    });
                } else if (result.status === 'Error') {
                    alerts.push({ severity: 'warning', message: 'EUDR Check Error', suggestedAction: 'Check system logs.' });
                }
            } else {
                response = "Error: Regulatory Check Skill not available.";
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
        return REQUIRED_DOCS.EUDR;
    }
}
