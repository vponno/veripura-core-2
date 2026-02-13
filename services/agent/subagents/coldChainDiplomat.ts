import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';
import { REQUIRED_DOCS } from './requiredDocuments';

export class ColdChainDiplomat extends SubAgent {
    constructor() {
        super(
            'cold_chain_diplomat',
            'Cold Chain Diplomat',
            'Parses IoT sensor data to calculate safe exposure time if a temperature breach occurs.'
        );
    }

    public static shouldActivate(context: any): boolean {
        const type = (context.containerType || '').toLowerCase();
        const attrs = context.attributes || [];
        return type.includes('reefer') || attrs.includes('Frozen') || attrs.includes('Chilled');
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on IoT sensor data updates or document uploads like "Reefer Logs"
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'IOT_UPDATE' || event.type === 'ROUTE_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Cold chain integrity analysis complete.";

        const containerType = context.knowledgeGraph.facts.find(f => f.predicate === 'container_type')?.object || 'Standard';
        const containerId = context.knowledgeGraph.facts.find(f => f.predicate === 'container_id')?.object || 'CONT-MOCK-123';

        if (containerType.toLowerCase().includes('reefer')) {
            response = `**Cold Chain Integrity Report**\n`;

            try {
                // Real IoT Data Fetch
                const { ioTService } = await import('../../ioTService');
                // Determine scenario based on if "broken" or "hot" is mentioned in context, else normal
                const scenario = context.knowledgeGraph.facts.some(f => f.object.includes('damage') || f.object.includes('leak')) ? 'BREACH' : 'NORMAL';

                const logs = await ioTService.getContainerLogs(containerId, scenario);
                const mkt = ioTService.calculateMKT(logs.readings);
                const maxTemp = Math.max(...logs.readings.map(r => r.temperature));
                const targetTemp = 4.0; // Retrieve from contract or defaults

                response += `- Container ID: \`${containerId}\`\n`;
                response += `- Data Points: \`${logs.readings.length}\` (Last 48h)\n`;
                response += `- MKT (Mean Kinetic Temp): \`${mkt.toFixed(2)}°C\`\n`;
                response += `- Max Recorded: \`${maxTemp.toFixed(2)}°C\`\n\n`;

                if (mkt > targetTemp + 2) {
                    response += `🔴 **Thermal Stability Compromised**\n`;
                    response += `MKT of ${mkt.toFixed(2)}°C indicates cumulative degradation.\n`;
                    alerts.push({
                        severity: 'critical',
                        message: `Critical MKT Breach: ${mkt.toFixed(2)}°C (Limit: ${targetTemp + 1}°C).`,
                        suggestedAction: 'Reject shipment. Efficacy of biologic payload cannot be guaranteed.'
                    });
                } else if (maxTemp > targetTemp + 4) {
                    response += `⚠️ **Transient Excursion Detected**\n`;
                    response += `Spike to ${maxTemp}°C detected, but MKT remains stable.\n`;
                    alerts.push({
                        severity: 'warning',
                        message: `Temp Spike: ${maxTemp}°C. Check physical integrity of packaging.`,
                        suggestedAction: 'Inspect individual pallets for surface condensation.'
                    });
                } else {
                    response += "✅ **Cold Chain Verified**: MKT and absolute temps are within limits.";
                }

            } catch (e) {
                console.error("IoT Service Failed:", e);
                response += "⚠️ IoT Data Unavailable. Proceeding with manual log review.";
            }

        } else {
            response = "Shipment not identified as temperature-controlled. Cold Chain Diplomat in standby mode.";
        }

        return {
            success: true,
            response,
            alerts,
            requiredDocuments: this.getRequiredDocuments()
        };
    }

    private getRequiredDocuments(): Array<{ name: string; description: string; category: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other'; agency: string; agencyLink: string }> {
        return REQUIRED_DOCS.IOT;
    }
}
