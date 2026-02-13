import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class PriceParityAgent extends SubAgent {
    constructor() {
        super(
            'price_parity_agent',
            'Price Parity Agent',
            'Detects under-invoicing or tax evasion by comparing declared prices to global market indexes.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on document uploads (Invoice/PO) or route/price updates
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Price parity analysis pending.";

        if (skills) {
            const calcSkill = skills.get('calculator_skill');
            if (calcSkill) {
                const priceFact = context.knowledgeGraph.facts.find(f => f.predicate === 'unit_price');
                const productFact = context.knowledgeGraph.facts.find(f => f.predicate === 'product_name');

                if (priceFact && productFact) {
                    const result = await calcSkill.execute({
                        type: 'price_parity',
                        data: {
                            declaredPrice: parseFloat(priceFact.object),
                            product: productFact.object
                        }
                    });

                    response = result.message;

                    if (result.status === 'Critical') {
                        alerts.push({
                            severity: 'critical',
                            message: result.message,
                            suggestedAction: 'Verify invoice authenticity. Possible Transfer Pricing Fraud.'
                        });
                    } else if (result.status === 'Warning') {
                        alerts.push({
                            severity: 'warning',
                            message: result.message,
                            suggestedAction: 'Request supporting proof of price.'
                        });
                    }
                } else {
                    response = "Declared unit price not found. Skipping parity check.";
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
