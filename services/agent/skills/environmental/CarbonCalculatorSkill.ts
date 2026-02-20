import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class CarbonCalculatorSkill implements ISkill {
    public id = 'carbon_calculator_skill';
    public name = 'Scope 3 Carbon Calculator';
    public category = SkillCategory.SCIENTIFIC; // or ENVIRONMENTAL
    public description = 'Calculates estimated carbon footprint for the shipment based on weight and distance.';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        const weight = metadata.weight || metadata.shipment?.weight || 1000; // kg
        const distance = metadata.distance || 5000; // km (Mock if not provided)
        const mode = metadata.transportMode || 'sea';

        let emissionFactor = 0.01; // kg CO2 per ton-km
        if (mode === 'air') emissionFactor = 0.60;
        if (mode === 'road') emissionFactor = 0.06;
        if (mode === 'rail') emissionFactor = 0.02;

        // Emissions = (Weight in tons) * Distance * Factor
        const weightTons = weight / 1000;
        const emissions = weightTons * distance * emissionFactor;

        return {
            success: true,
            confidence: 0.9,
            data: {
                weightKg: weight,
                distanceKm: distance,
                mode,
                emissionsKgCO2: emissions
            },
            requiresHumanReview: false,
            verdict: 'COMPLIANT',
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'CARBON_CALC',
                details: `Estimated Emissions: ${emissions.toFixed(2)} kg CO2e`
            }]
        };
    }
}
