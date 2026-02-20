import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class CarbonCalculatorSkill implements ISkill {
    public id = 'carbon_calculator_skill';
    public name = 'Carbon Calculator';
    public category = SkillCategory.SCIENTIFIC;
    public description = 'Calculates Scope 3 emissions based on shipment weight, distance, and mode (GLEC Framework).';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        const weightTons = metadata.weightTons || metadata.shipment?.weightTons || 0;
        const distanceKm = metadata.distanceKm || metadata.shipment?.distanceKm || 0;
        const mode = metadata.transportMode || metadata.shipment?.mode || 'sea';

        if (weightTons <= 0 || distanceKm <= 0) {
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: true,
                verdict: 'UNKNOWN',
                auditLog: [{
                    timestamp: new Date().toISOString(),
                    action: 'MISSING_DATA',
                    details: 'Missing weight or distance for carbon calculation'
                }]
            };
        }

        // Logic from calculator.ts
        // GLEC-derived factors map
        const factors: Record<string, number> = {
            'sea': 0.015,
            'air': 0.602,
            'road': 0.105,
            'rail': 0.022
        };
        const factor = factors[mode.toLowerCase()] || 0.05;
        const total = weightTons * distanceKm * factor;

        return {
            success: true,
            confidence: 0.9,
            data: {
                totalEmissionsKg: total,
                intensityFactor: factor,
                unit: 'kg CO2e',
                details: `Based on ${weightTons}t over ${distanceKm}km via ${mode}`
            },
            requiresHumanReview: false,
            verdict: 'COMPLIANT', // Information only, usually doesn't block unless threshold set
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'CALCULATION_COMPLETE',
                details: `Estimated Emissions: ${total.toFixed(2)} kg CO2e`
            }]
        };
    }

    async validateContext(context: SkillContext): Promise<boolean> {
        return !!(context.metadata.weightTons || context.metadata.shipment?.weightTons);
    }
}
