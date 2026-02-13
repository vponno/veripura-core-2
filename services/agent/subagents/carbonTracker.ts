import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class CarbonTracker extends SubAgent {
    constructor() {
        super(
            'carbon_tracker',
            'Carbon Tracker',
            'Estimates Scope 3 logistics emissions and checks against sustainability targets.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on route updates, cargo weight updates, or document uploads
        return event.type === 'ROUTE_UPDATE' || event.type === 'DOCUMENT_UPLOAD';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Carbon analysis pending.";

        if (skills) {
            const calcSkill = skills.get('calculator_skill');
            if (calcSkill) {
                const weightFact = context.knowledgeGraph.facts.find(f => f.predicate === 'gross_weight');
                const distanceFact = context.knowledgeGraph.facts.find(f => f.predicate === 'total_distance_km');
                const modeFact = context.knowledgeGraph.facts.find(f => f.predicate === 'transport_mode');

                if (weightFact && distanceFact) {
                    const result = await calcSkill.execute({
                        type: 'emissions_scope3',
                        data: {
                            weightTons: parseFloat(weightFact.object) / 1000,
                            distanceKm: parseFloat(distanceFact.object),
                            mode: modeFact?.object
                        }
                    });

                    response = result.message;

                    if (result.data.intensity > 0.5) { // Air freight threshold
                        alerts.push({
                            severity: 'info',
                            message: 'High Carbon Intensity Route (Air Freight).',
                            suggestedAction: 'Review modal shift options.'
                        });
                    }
                } else {
                    response = "Missing weight or distance data for carbon calculation.";
                }
            }
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
