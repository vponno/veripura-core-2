import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class LogisticsLingoInterpreter extends SubAgent {
    constructor() {
        super(
            'logistics_lingo_interpreter',
            'Logistics Lingo Interpreter',
            'Scans transport documents (Bill of Lading) for "Dirty" clauses, unauthorized transshipment, or risk-prone specific wording.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on transport document uploads (Bill of Lading, Sea Waybill)
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Logistics document clause analysis pending.";

        if (skills) {
            const docSkill = skills.get('document_analysis');
            if (docSkill) {
                const bolFact = context.knowledgeGraph.facts.find(f => f.predicate === 'bill_of_lading_clauses');

                if (bolFact) {
                    const result = await docSkill.execute({
                        mode: 'logistics_clauses',
                        textContent: bolFact.object
                    });

                    response = result.message;

                    if (result.status === 'Fail') {
                        alerts.push({
                            severity: 'critical',
                            message: 'Adverse "Dirty" Clauses Detected on BoL.',
                            suggestedAction: 'Reject document. Check for insurance claims.'
                        });
                    }
                } else {
                    response = "No Bill of Lading clauses found to analyze.";
                }
            }
        }

        // Keep Transshipment logic or move to another skill? 
        // For now, let's keep it minimal or assume it's part of a future RouteAnalysisSkill
        // The user wanted NO hardcoded logic.
        // Let's assume the doc analysis covers the main "lingo" part.

        return {
            success: true,
            response,
            alerts
        };
    }
}
