import { ISkill, SkillCategory, SkillContext, SkillResult } from '../types';

export class CalculatorSkill implements ISkill {
    public id = 'calculator_skill';
    public name = 'General Business Calculator';
    public category = SkillCategory.FINANCIAL;
    public description = 'Handles complex business calculations including wage gaps and price parity analysis.';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { type, data } = context;

        if (type === 'wage_gap') {
            const { origin, declaredWage } = data;
            // Mock benchmarks for now
            const benchmarks: Record<string, number> = {
                'Vietnam': 250,
                'Ethiophia': 150,
                'India': 220,
                'China': 450,
                'Indonesia': 300
            };

            const benchmark = benchmarks[origin] || 200;
            const gap = benchmark - declaredWage;
            const isCompliant = declaredWage >= benchmark;

            return {
                success: true,
                confidence: 0.85,
                data: { benchmark, declaredWage, gap },
                requiresHumanReview: !isCompliant,
                verdict: isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
                message: isCompliant
                    ? `Wage of $${declaredWage} meets or exceeds regional benchmark ($${benchmark}).`
                    : `CRITICAL: Declared wage ($${declaredWage}) is below fair-wage benchmark ($${benchmark}) for ${origin}.`,
                status: isCompliant ? 'Pass' : 'Fail',
                auditLog: [{
                    timestamp: new Date().toISOString(),
                    action: 'WAGE_GAP_ANALYSIS',
                    details: `Origin: ${origin}, Wage: ${declaredWage}, Benchmark: ${benchmark}`
                }]
            };
        }

        if (type === 'price_parity') {
            const { declaredPrice, product } = data;
            // Mock market prices
            const marketPrices: Record<string, number> = {
                'Organic Coffee': 8.5,
                'Fair Trade Cocoa': 4.2,
                'Raw Sugar': 0.6,
                'Specialty Tea': 12.0
            };

            const marketPrice = marketPrices[product] || 5.0;
            const deviation = Math.abs((declaredPrice - marketPrice) / marketPrice);
            const isExtreme = deviation > 0.5; // > 50% deviation
            const isWarning = deviation > 0.2; // > 20% deviation

            let verdict: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' = 'COMPLIANT';
            let status: 'Pass' | 'Warning' | 'Critical' = 'Pass';
            let message = `Declared price ($${declaredPrice}) is within market parity for ${product}.`;

            if (isExtreme) {
                verdict = 'NON_COMPLIANT';
                status = 'Critical';
                message = `CRITICAL: Extreme price deviation found! Declared $${declaredPrice} but market index is $${marketPrice} for ${product}. Possible fraud alert.`;
            } else if (isWarning) {
                verdict = 'WARNING';
                status = 'Warning';
                message = `Warning: Significant price deviation detected. Declared $${declaredPrice} vs market index $${marketPrice}.`;
            }

            return {
                success: true,
                confidence: 0.9,
                data: { marketPrice, declaredPrice, deviation },
                requiresHumanReview: isExtreme || isWarning,
                verdict,
                message,
                status,
                auditLog: [{
                    timestamp: new Date().toISOString(),
                    action: 'PRICE_PARITY_CHECK',
                    details: `Product: ${product}, Declared: ${declaredPrice}, Market: ${marketPrice}`
                }]
            };
        }

        return {
            success: false,
            confidence: 0,
            errors: [`Calculation type "${type}" not supported by ${this.id}`],
            auditLog: []
        };
    }
}
