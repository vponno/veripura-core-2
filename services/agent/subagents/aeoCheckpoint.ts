import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class AEOCheckpoint extends SubAgent {
    constructor() {
        super(
            'aeo_checkpoint',
            'AEO Checkpoint',
            'Ensures Authorized Economic Operator (AEO) security criteria are met.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // AEO status is relevant for all shipments to determine inspection levels
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "AEO status validation complete.";

        // Extract AEO numbers from context
        const exporterAEOfact = context.knowledgeGraph.facts.find(f => f.predicate === 'exporter_aeo_number');
        const importerAEOfact = context.knowledgeGraph.facts.find(f => f.predicate === 'importer_aeo_number');

        response = `**Customs Flow Report (AEO)**\n`;

        if (exporterAEOfact || importerAEOfact) {
            const expAEO = exporterAEOfact?.object || 'N/A';
            const impAEO = importerAEOfact?.object || 'N/A';

            response += `✅ **AEO Status Detected**:\n`;
            if (exporterAEOfact) response += `- Exporter AEO: \`${expAEO}\`\n`;
            if (importerAEOfact) response += `- Importer AEO: \`${impAEO}\`\n\n`;

            response += "🟢 **Recommendation**: Safe-lane processing enabled. This shipment qualifies for reduced physical inspections and priority customs clearance.";
        } else {
            response += "⚠️ **No AEO Status Detected**: No Authorized Economic Operator numbers found in the documentation.\n\n";
            response += "🟠 **Recommendation**: Standard-lane processing. Expect normal inspection lead times.";

            alerts.push({
                severity: 'info',
                message: 'AEO Status Not Found: Shipment does not qualify for priority customs lanes.',
                suggestedAction: 'For future shipments, ensure AEO certification numbers are included in the master profile to reduce lead times by 20-30%.'
            });
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
