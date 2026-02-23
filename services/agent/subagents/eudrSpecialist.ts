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
        const willActivate = context.destination === 'Netherlands' || context.destination?.includes('EU');
        console.log(`[EUDRSpecialist] shouldActivate check: destination="${context.destination}" → ${willActivate ? 'ACTIVATED' : 'not activated'}`);
        return willActivate;
    }

    canHandle(event: AgentEvent): boolean {
        const canHandle = event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
        console.log(`[EUDRSpecialist] canHandle check: event="${event.type}" → ${canHandle ? 'YES' : 'NO'}`);
        return canHandle;
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [EUDRSpecialist] 🔍 Processing Event                    ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║ Event ID:   ${event.id}`);
        console.log(`║ Event Type: ${event.type}`);
        console.log(`║ Skills:     ${skills ? 'Available' : 'None'}`);
        console.log('╚════════════════════════════════════════════════════════════╝');
        
        const alerts: AgentAlert[] = [];
        let response = "EUDR verification pending.";

        // DELEGATE TO SKILL: Regulatory Check
        if (skills) {
            const regSkill = skills.get('regulatory_check_skill');
            console.log(`[EUDRSpecialist] Looking for regulatory_check_skill: ${regSkill ? 'FOUND' : 'NOT FOUND'}`);
            
            if (regSkill) {
                // Extract context for the skill
                const productFact = context.knowledgeGraph.facts.find(f => f.predicate === 'product_name');
                const geoFact = context.knowledgeGraph.facts.find(f => f.predicate === 'geolocation_coordinates');
                const deforestFact = context.knowledgeGraph.facts.find(f => f.predicate === 'deforestation_free');

                console.log('[EUDRSpecialist] Knowledge Graph facts:', {
                    product: productFact?.object,
                    geolocation: geoFact?.object,
                    deforestationFree: deforestFact?.object
                });

                console.log('[EUDRSpecialist] Executing regulatory_check_skill...');
                const result = await regSkill.execute({
                    metadata: {
                        regulation: 'EUDR',
                        product: productFact?.object || '',
                        geolocation: geoFact?.object,
                        deforestationFree: deforestFact?.object === 'true'
                    }
                });

                console.log('[EUDRSpecialist] Skill result:', {
                    success: result.success,
                    status: result.status,
                    message: result.message?.substring(0, 100)
                });

                response = result.message || response;

                if (result.status === 'Fail' || result.verdict === 'NON_COMPLIANT') {
                    alerts.push({
                        severity: 'critical',
                        message: result.message || 'EUDR compliance check failed',
                        suggestedAction: 'Ensure geolocation data is provided and verified.'
                    });
                    console.log('[EUDRSpecialist] ⚠️ CRITICAL ALERT: EUDR compliance failed');
                } else if (result.status === 'Error') {
                    alerts.push({ severity: 'warning', message: 'EUDR Check Error', suggestedAction: 'Check system logs.' });
                    console.log('[EUDRSpecialist] ⚠️ WARNING: EUDR check error');
                } else {
                    console.log('[EUDRSpecialist] ✓ EUDR check passed');
                }
            } else {
                response = "Error: Regulatory Check Skill not available.";
                console.warn('[EUDRSpecialist] ⚠️ regulatory_check_skill not found in registry');
            }
        }

        const requiredDocs = this.getRequiredDocuments();
        console.log(`[EUDRSpecialist] Returning ${requiredDocs.length} required documents`);

        return {
            success: true,
            response,
            alerts,
            requiredDocuments: requiredDocs
        };
    }

    private getRequiredDocuments(): Array<{ name: string; description: string; category: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other'; agency: string; agencyLink: string }> {
        return REQUIRED_DOCS.EUDR;
    }
}
