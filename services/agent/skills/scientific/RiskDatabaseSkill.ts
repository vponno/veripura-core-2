import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class RiskDatabaseSkill implements ISkill {
    public id = 'risk_database_skill';
    public name = 'Risk Database Lookup';
    public category = SkillCategory.SCIENTIFIC; // Or REGULATORY, but plan put it in Scientific for "Bio-security"
    public description = 'Checks specific risk databases for bio-security and phytosanitary risks.';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        // Support query style from old skill or direct metadata
        const hsCode = metadata.hsCode || metadata.product?.hsCode || '';
        const packaging = metadata.packaging || metadata.shipment?.packaging || '';
        const origin = metadata.origin || '';

        const risks: string[] = [];

        // Logic from riskDatabase.ts
        if (packaging.toLowerCase().includes('wood')) {
            risks.push('ISPM15_CHECK_REQUIRED: Wood packaging requires treatment mark.');
        }

        if (['06', '07', '12'].some((p: string) => hsCode.startsWith(p))) {
            risks.push('PHYTOSANITARY_CERT_REQUIRED: Plant products often require health certificates.');
        }

        // New logic we might want to add for WOAH/OIE if we had the API
        // if (origin === 'SomeHighRiskZone') ...

        if (risks.length > 0) {
            return {
                success: true,
                confidence: 0.85,
                data: { risks },
                requiresHumanReview: true,
                verdict: 'WARNING',
                auditLog: [{
                    timestamp: new Date().toISOString(),
                    action: 'RISK_DETECTED',
                    details: risks.join('; ')
                }],
                errors: risks
            };
        }

        return {
            success: true,
            confidence: 0.9,
            data: { risks: [] },
            requiresHumanReview: false,
            verdict: 'COMPLIANT',
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'CHECK_PASSED',
                details: 'No specific bio-security risks identified.'
            }]
        };
    }

    async validateContext(context: SkillContext): Promise<boolean> {
        return !!(context.metadata.hsCode || context.metadata.packaging);
    }
}
