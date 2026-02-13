import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';

export class BioSecurityBorderGuard extends SubAgent {
    constructor() {
        super(
            'bio_security_border_guard',
            'Bio-Security Border Guard',
            'Focuses on invasive species, wood packaging heat treatments (ISPM 15), and seed quarantine.'
        );
    }

    public static shouldActivate(context: any): boolean {
        const hsPrefix = (context.hsCode || '').substring(0, 2);
        const packaging = (context.packaging || '').toLowerCase();
        // 06 (Plants), 07 (Veg), 12 (Seeds), 44 (Wood)
        return ['06', '07', '12', '44'].includes(hsPrefix) || packaging.includes('wood') || packaging.includes('pallet');
    }

    canHandle(event: AgentEvent): boolean {
        // Triggers on phytosanitary certificates, packing lists (for wood), or seeds
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE' || !!event.payload?.hsCode;
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "Bio-security/Risk analysis pending.";

        if (skills) {
            const riskSkill = skills.get('risk_database');
            if (riskSkill) {
                const hsCode = context.knowledgeGraph.facts.find(f => f.predicate === 'hs_code')?.object;
                const packaging = context.knowledgeGraph.facts.find(f => f.predicate === 'packaging_material')?.object;

                const result = await riskSkill.execute({
                    domain: 'biosecurity',
                    query: { hsCode, packaging }
                });

                response = result.message;

                if (result.status === 'Risk') {
                    const risks = result.data.risks as string[];
                    if (risks.includes('ISPM15_CHECK_REQUIRED')) {
                        // Double check if ISPM15 exists
                        const hasStamp = context.knowledgeGraph.facts.some(f => f.predicate === 'ispm15_stamp_detected' && f.object === 'true');
                        if (!hasStamp) {
                            alerts.push({
                                severity: 'critical',
                                message: 'Wood Packaging Detected: Missing ISPM 15 Stamp.',
                                suggestedAction: 'Verify heat treatment certification.'
                            });
                            response += " (Missing ISPM15)";
                        } else {
                            response += " (ISPM15 Verified)";
                        }
                    }
                    if (risks.includes('PHYTOSANITARY_CERT_REQUIRED')) {
                        const hasPhyto = context.knowledgeGraph.facts.some(f => f.predicate === 'document_type' && f.object === 'Phytosanitary_Certificate');
                        if (!hasPhyto) {
                            alerts.push({
                                severity: 'critical',
                                message: 'Plant Product: Missing Phytosanitary Certificate.',
                                suggestedAction: 'Upload Phyto Cert immediately.'
                            });
                            response += " (Missing Phyto Cert)";
                        } else {
                            response += " (Phyto Cert Verified)";
                        }
                    }
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
