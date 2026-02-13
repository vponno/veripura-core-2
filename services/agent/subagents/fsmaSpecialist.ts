import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';
import { REQUIRED_DOCS } from './requiredDocuments';

export class FSMASpecialist extends SubAgent {
    constructor() {
        super(
            'fsma_specialist',
            'FSMA Specialist',
            'Ensures compliance with FDA Food Safety Modernization Act (FSMA) for US imports.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return context.destination === 'USA';
    }

    canHandle(event: AgentEvent): boolean {
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "FSMA compliance analysis complete.";

        // Triggers primarily on USA destination
        const destination = context.knowledgeGraph.facts.find(f => f.predicate === 'destination_country')?.object || 'Unknown';

        // DELEGATE TO SKILL: Regulatory Check
        if (skills) {
            const regSkill = skills.get('regulatory_check');
            if (regSkill) {
                const hasPCQI = context.knowledgeGraph.facts.some(f => f.predicate === 'document_type' && f.object === 'PCQI_Certificate');
                // FSVP check - usually implies FSVP Agent or Hazard Analysis
                const hasHazardAnalysis = context.knowledgeGraph.facts.some(f => f.predicate === 'document_type' && f.object === 'Hazard_Analysis');

                const result = await regSkill.execute({
                    regulation: 'FSMA',
                    context: {
                        product: context.knowledgeGraph.facts.find(f => f.predicate === 'product_name')?.object || '',
                        destination: destination,
                        fsvp: hasHazardAnalysis, // Mapping Hazard Analysis to FSVP requirement for now
                        pcqi: hasPCQI
                    }
                });

                response = result.message;

                if (result.status === 'Fail') {
                    // Extract specific violations from result data if available, or use generic message
                    const violations = result.data?.violations || [result.message];
                    violations.forEach((v: string) => {
                        alerts.push({
                            severity: 'critical',
                            message: v,
                            suggestedAction: 'Upload missing FSMA documentation (FSVP/PCQI).'
                        });
                    });
                } else if (result.status === 'Warning') {
                    alerts.push({ severity: 'warning', message: result.message, suggestedAction: 'Review FSMA suggestions.' });
                }
            } else {
                response = "Error: Regulatory Check Skill not available.";
            }
        } else {
            response = "Error: Skills registry not provided.";
        }

        return {
            success: true,
            response,
            alerts,
            requiredDocuments: this.getRequiredDocuments(destination)
        };
    }

    private getRequiredDocuments(destination: string): Array<{ name: string; description: string; category: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other'; agency: string; agencyLink: string }> {
        if (destination !== 'USA') return REQUIRED_DOCS.GENERAL;
        return REQUIRED_DOCS.FSMA;
    }
}
