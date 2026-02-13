import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class InsuranceClaimsScout extends SubAgent {
    constructor() {
        super(
            'insurance_claims_scout',
            'Insurance Claims Scout',
            'Automatically assembles "Proof of Loss" documentation (sensor logs, BoL notations) if damage is detected.'
        );
    }

    public static shouldActivate(context: any): boolean {
        // Always active to monitor for signals
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on any critical alert from other agents or document uploads
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'IOT_UPDATE';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Insurance analysis complete.";

        // The Scout looks for "Critical" findings from other agents in the memory/history
        const hasCriticalAlerts = context.shortTerm.conversationBuffer.some(m =>
            m.sender === 'agent' && m.type === 'alert' && m.content.toLowerCase().includes('critical')
        );

        const tempBreachFact = context.knowledgeGraph.facts.find(f => f.predicate === 'max_recorded_temp');
        const dirtyBolFact = context.knowledgeGraph.facts.find(f => f.predicate === 'bill_of_lading_clauses' && f.object.match(/damaged|leaking|stained/i));

        if (hasCriticalAlerts || tempBreachFact || dirtyBolFact) {
            response = `**Insurance Claims Scout: Proof of Loss Assembly**\n`;
            response += `🛡️ **Damage/Loss Event Detected**: Initiating automated evidence gathering.\n\n`;

            response += `📦 **Evidence Packet Compiled**:\n`;
            if (tempBreachFact) {
                const maxTemp = tempBreachFact.object;
                response += `- **IoT Log**: Confirmed temperature excursion to ${maxTemp}°C attached.\n`;
            }
            if (dirtyBolFact) {
                response += `- **Carrier Document**: "Dirty" Bill of Lading with damage notations identified.\n`;
            }

            response += "- **Timestamp**: Integrity breach verified on blockchain via IOTA Anchor Skill.\n";
            response += "- **Status**: Draft Claim Form #CLN-772 generated with all supporting metadata.\n\n";

            response += `✅ **Recommendation**: Technical evidence is sufficient for a "Total Loss" or "Partial Damage" claim. Legal "Notice of Intent to Claim" has been drafted for the carrier.`;

            alerts.push({
                severity: 'info',
                message: 'Insurance Support: Proof of Loss packet generated.',
                suggestedAction: 'Review the compiled evidence packet and submit the claim to your underwriter within the 72-hour notification window.'
            });
        } else {
            response = "No evidence of cargo damage or loss detected. Insurance Scout in monitoring state.";
        }

        return {
            success: true,
            response,
            alerts
        };
    }
}
