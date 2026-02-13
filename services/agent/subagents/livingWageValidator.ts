import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class LivingWageValidator extends SubAgent {
    constructor() {
        super(
            'living_wage_validator',
            'Living Wage Validator',
            'Cross-references supply chain locations with regional fair-wage benchmarks to detect labor risks.'
        );
    }

    public static shouldActivate(context: any): boolean {
        // Active for high-risk origins or specific attributes
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on origin updates, supplier data, or invoice uploads
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Labor compliance analysis pending.";

        if (skills) {
            const calcSkill = skills.get('calculator_skill');
            if (calcSkill) {
                const originFact = context.knowledgeGraph.facts.find(f => f.predicate === 'origin_country');
                const wageFact = context.knowledgeGraph.facts.find(f => f.predicate === 'declared_wage_monthly');

                if (originFact) {
                    const result = await calcSkill.execute({
                        type: 'wage_gap',
                        data: {
                            origin: originFact.object,
                            declaredWage: parseFloat(wageFact?.object || '0')
                        }
                    });

                    response = result.message;

                    if (result.status === 'Fail') {
                        alerts.push({
                            severity: 'critical',
                            message: result.message,
                            suggestedAction: 'Request social audit report (SMETA).'
                        });
                    }
                } else {
                    response = "Origin country unknown. Skipping wage analysis.";
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
