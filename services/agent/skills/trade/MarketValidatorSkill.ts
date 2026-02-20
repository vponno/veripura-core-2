import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class MarketValidatorSkill implements ISkill {
    public id = 'market_validator_skill';
    public name = 'Market Price Validator';
    public category = SkillCategory.TRADE;
    public description = 'Compares declared prices against market indices to detect under-invoicing or transfer pricing issues.';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        const declaredPrice = metadata.declaredPrice || metadata.shipment?.value;
        const product = metadata.product || metadata.shipment?.product;

        if (!declaredPrice || !product) {
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: true,
                verdict: 'UNKNOWN',
                auditLog: [{ timestamp: new Date().toISOString(), action: 'MISSING_DATA', details: 'Missing price or product data' }]
            };
        }

        // Index Price Logic (Migrated from calculator.ts)
        // In a real scenario, this would call a live market data API (e.g., Bloomberg/Refinitiv)
        let indexPrice = 0;
        const p = product.toLowerCase();

        if (p.includes('coffee')) indexPrice = 4.50; // USD/kg
        else if (p.includes('shrimp')) indexPrice = 8.20;
        else if (p.includes('meat') || p.includes('beef')) indexPrice = 6.00;
        else if (p.includes('cocoa')) indexPrice = 3.80;
        else if (p.includes('solar panel')) indexPrice = 2500.00; // Per unit (commercial)

        if (indexPrice === 0) {
            return {
                success: true,
                confidence: 0.5,
                data: { declaredPrice },
                requiresHumanReview: true,
                verdict: 'UNKNOWN',
                auditLog: [{ timestamp: new Date().toISOString(), action: 'SKIPPED', details: 'No market index found for product' }]
            };
        }

        const deviation = ((indexPrice - declaredPrice) / indexPrice) * 100;
        let verdict: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' = 'COMPLIANT';
        let message = `Price within range. Deviation: ${deviation.toFixed(1)}%`;

        // Transfer Pricing Logic
        if (deviation > 30) {
            verdict = 'NON_COMPLIANT';
            message = `Potential Under-invoicing: Declared ${declaredPrice} vs Market ${indexPrice} (${deviation.toFixed(1)}% variance)`;
        } else if (deviation > 15) {
            verdict = 'WARNING';
            message = `Price Warning: ${deviation.toFixed(1)}% below market index.`;
        }

        return {
            success: verdict !== 'NON_COMPLIANT',
            confidence: 0.85,
            data: {
                declaredPrice,
                marketIndex: indexPrice,
                deviationPercent: deviation,
                currency: 'USD'
            },
            requiresHumanReview: verdict !== 'COMPLIANT',
            verdict,
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'PRICE_CHECK',
                details: message
            }]
        };
    }

    async validateContext(context: SkillContext): Promise<boolean> {
        return !!(context.metadata.declaredPrice || context.metadata.shipment?.value);
    }
}
