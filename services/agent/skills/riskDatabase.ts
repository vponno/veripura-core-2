import { Skill, SkillResult } from './skillRegistry';

export class RiskDatabaseSkill implements Skill {
    id = 'risk_database';
    name = 'Risk Database Lookup';
    description = 'Checks specific risk databases for bio-security and insurance risks.';

    async execute(payload: any): Promise<SkillResult> {
        const { domain, query } = payload;

        if (domain === 'biosecurity') {
            const { hsCode, packaging } = query;
            // Logic extracted from BioSecurityBorderGuard
            const risks: string[] = [];

            if ((packaging || '').toLowerCase().includes('wood')) {
                risks.push('ISPM15_CHECK_REQUIRED');
            }

            if (['06', '07', '12'].some((p: string) => (hsCode || '').startsWith(p))) {
                risks.push('PHYTOSANITARY_CERT_REQUIRED');
            }

            return {
                success: true,
                status: risks.length > 0 ? 'Risk' : 'Clean',
                message: risks.length > 0 ? 'Bio-security risks identified.' : 'No consolidated risks.',
                data: { risks },
                score: 1.0
            };
        }

        return { success: false, status: 'Error', message: 'Unknown domain', score: 0 };
    }
}
