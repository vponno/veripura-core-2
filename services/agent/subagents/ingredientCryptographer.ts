import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class IngredientCryptographer extends SubAgent {
    constructor() {
        super(
            'ingredient_cryptographer',
            'Ingredient Cryptographer',
            'Deconstructs ingredient lists and E-numbers to find substances banned in specific markets.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return !!context.ingredientsList || context.productType === 'Processed Food';
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on technical specifications, ingredient lists, or lab reports
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Ingredient analysis pending.";

        if (skills) {
            const ingSkill = skills.get('ingredient_analysis');
            if (ingSkill) {
                const ingredientsFact = context.knowledgeGraph.facts.find(f => f.predicate === 'ingredients_list');
                const destFact = context.knowledgeGraph.facts.find(f => f.predicate === 'destination_country');

                if (ingredientsFact) {
                    const result = await ingSkill.execute({
                        ingredients: ingredientsFact.object,
                        destination: destFact?.object
                    });

                    response = result.message;

                    if (result.status === 'Fail') {
                        alerts.push({
                            severity: 'critical',
                            message: result.message,
                            suggestedAction: 'Reformulate product or divert shipment to non-restricted market.'
                        });
                    }
                } else {
                    response = "No ingredient list found.";
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
