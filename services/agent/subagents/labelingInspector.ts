import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class LabelingInspector extends SubAgent {
    constructor() {
        super(
            'labeling_inspector',
            'Labeling Inspector',
            'Analyzes packaging and labels for allergen warnings, nutrition facts, and local regulatory compliance.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on document uploads (especially images/artwork)
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Labeling compliance analysis pending.";

        if (skills) {
            const labelSkill = skills.get('labeling_compliance');
            if (labelSkill) {
                const extractedText = context.knowledgeGraph.facts.find(f => f.predicate === 'ocr_text_content')?.object;
                const dest = context.knowledgeGraph.facts.find(f => f.predicate === 'destination_country')?.object;

                if (extractedText) {
                    const result = await labelSkill.execute({
                        labelText: extractedText,
                        jurisdiction: dest
                    });

                    response = result.message;

                    if (result.status === 'Fail') {
                        alerts.push({
                            severity: 'critical',
                            message: result.message,
                            suggestedAction: 'Revise packaging label.'
                        });
                    }
                } else {
                    response = "No extracted label text found to analyze.";
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
