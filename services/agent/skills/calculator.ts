import { Skill, SkillResult } from './skillRegistry';

export class CalculatorSkill implements Skill {
    id = 'calculator_skill';
    name = 'Compliance Calculator';
    description = 'Performs specialized calculations for emissions, wage parity, and price valuation.';

    async execute(payload: any): Promise<SkillResult> {
        const { type, data } = payload;

        switch (type) {
            case 'emissions_scope3':
                return this.calculateEmissions(data);
            case 'price_parity':
                return this.calculatePriceParity(data);
            case 'wage_gap':
                return this.calculateWageGap(data);
            default:
                return { success: false, status: 'Error', message: `Unknown calculation type: ${type}`, score: 0 };
        }
    }

    private calculateEmissions(data: any): SkillResult {
        const { weightTons, distanceKm, mode } = data;
        // GLEC-derived factors map
        const factors: Record<string, number> = {
            'sea': 0.015,
            'air': 0.602,
            'road': 0.105,
            'rail': 0.022
        };
        const factor = factors[mode?.toLowerCase()] || 0.05;
        const total = weightTons * distanceKm * factor;

        return {
            success: true,
            status: 'Pass',
            message: `Estimated Emissions: ${total.toFixed(2)} kg CO2e`,
            data: { totalEmissions: total, intensity: factor },
            score: 1.0
        };
    }

    private calculatePriceParity(data: any): SkillResult {
        const { declaredPrice, product } = data;
        let indexPrice = 0;

        // Mock DB: In real world, fetch from DB or API
        if (product.toLowerCase().includes('coffee')) indexPrice = 4.5;
        if (product.toLowerCase().includes('shrimp')) indexPrice = 8.2;
        if (product.toLowerCase().includes('meat')) indexPrice = 6.0;

        if (indexPrice === 0) return { success: true, status: 'Skipped', message: 'No index available.', score: 0 };

        const deviation = ((indexPrice - declaredPrice) / indexPrice) * 100;
        const status = deviation > 30 ? 'Critical' : deviation > 15 ? 'Warning' : 'Pass';

        return {
            success: true,
            status,
            message: `Price Deviation: ${deviation.toFixed(1)}%`,
            data: { deviation, marketPrice: indexPrice },
            score: status === 'Pass' ? 1.0 : 0
        };
    }

    private calculateWageGap(data: any): SkillResult {
        const { origin, declaredWage } = data;
        // Mock DB
        const benchmarks: Record<string, number> = {
            'Vietnam': 8500000, // VND
            'Ethiopia': 7500, // ETB
            'India': 24000, // INR
            'Brazil': 3200 // BRL
        };

        const benchmark = benchmarks[origin];
        if (!benchmark) return { success: true, status: 'Skipped', message: 'No regional benchmark.', score: 0 };

        const ratio = declaredWage / benchmark;
        const status = ratio < 0.8 ? 'Fail' : 'Pass';

        return {
            success: true,
            status,
            message: `Wage Ratio: ${(ratio * 100).toFixed(0)}% of benchmark`,
            data: { ratio, benchmark },
            score: ratio
        };
    }
}
