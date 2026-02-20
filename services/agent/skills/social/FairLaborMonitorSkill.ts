import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class FairLaborMonitorSkill implements ISkill {
    public id = 'fair_labor_monitor_skill';
    public name = 'Fair Labor Monitor';
    public category = SkillCategory.SOCIETAL;
    public description = 'Monitors supply chain for forced labor risks and wage parity issues.';

    // Logic from forcedLabor.ts
    private highRiskRegions = ['XU', 'XJ', 'HI'];
    private highRiskProducts = ['cotton', 'tomatoes', 'solar panels', 'polysilicon', 'aluminum', 'copper'];

    // Logic from calculator.ts (Wage Gap)
    private wageBenchmarks: Record<string, number> = {
        'Vietnam': 8500000, // VND
        'Ethiopia': 7500, // ETB
        'India': 24000, // INR
        'Brazil': 3200 // BRL
    };

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        const supplier = metadata.supplier || metadata.shipment?.supplier;
        const origin = metadata.origin || metadata.shipment?.origin;
        const products = metadata.products || (metadata.shipment?.product ? [metadata.shipment.product] : []);
        const declaredWage = metadata.declaredWage; // Optional

        const alerts: string[] = [];
        const warnings: string[] = [];
        let severity: 'info' | 'warning' | 'critical' = 'info';

        // 1. Forced Labor Checks
        if (origin && this.highRiskRegions.some(r => origin.includes(r))) {
            alerts.push(`High-risk region detected: ${origin}`);
            severity = 'critical';
        }

        if (products.some((p: string) => this.highRiskProducts.includes(p.toLowerCase()))) {
            warnings.push(`High-risk product detected: ${products.join(', ')}`);
            if (origin && this.highRiskRegions.some(r => origin.includes(r))) {
                alerts.push(`CRITICAL: High-risk product from high-risk region`);
                severity = 'critical';
            }
        }

        // 2. Wage Gap Analysis (if data available)
        if (declaredWage && origin) {
            const benchmark = this.wageBenchmarks[origin];
            if (benchmark) {
                const ratio = declaredWage / benchmark;
                if (ratio < 0.8) {
                    warnings.push(`Low Wage Alert: ${(ratio * 100).toFixed(0)}% of regional living wage benchmark`);
                } else {
                    // info.push(`Wage compliant: ${(ratio * 100).toFixed(0)}% of benchmark`);
                }
            }
        }

        const verdict = severity === 'critical' ? 'NON_COMPLIANT' : (warnings.length > 0 ? 'WARNING' : 'COMPLIANT');

        return {
            success: severity !== 'critical',
            confidence: 0.85,
            data: {
                supplier,
                origin,
                riskLevel: severity,
                alerts,
                warnings
            },
            requiresHumanReview: verdict !== 'COMPLIANT',
            verdict,
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'LABOR_CHECK',
                details: `Analysis complete. Verdict: ${verdict}`
            }]
        };
    }

    async validateContext(context: SkillContext): Promise<boolean> {
        return !!(context.metadata.supplier || context.metadata.origin);
    }
}
