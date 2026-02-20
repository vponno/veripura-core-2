import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class TariffOptimizerSkill implements ISkill {
    public id = 'tariff_optimizer_skill';
    public name = 'Tariff Optimizer';
    public category = SkillCategory.REGULATORY;
    public description = 'Analyzes product description to suggest optimal HS codes for lower duties.';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        const currentHsCode = metadata.hsCode || metadata.shipment?.hsCode;
        const productDesc = metadata.product || metadata.shipment?.product;

        if (!productDesc) {
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: true,
                verdict: 'UNKNOWN',
                auditLog: [{ timestamp: new Date().toISOString(), action: 'SKIPPED', details: 'No product description' }]
            };
        }

        // Mock logic: Suggest specific code for "Solar Panels"
        let suggestion = null;
        let potentialSavings = 0;

        if (productDesc.toLowerCase().includes('solar panel') && currentHsCode !== '85414300') {
            suggestion = {
                code: '85414300',
                description: 'Photovoltaic cells assembled in modules or made up into panels',
                dutyRate: 0.0, // Duty free in many places
                reason: 'More specific classification for assembled modules often yields 0% duty vs general electronics.'
            };
            potentialSavings = 5000; // Mock savings
        }

        return {
            success: true,
            confidence: 0.85,
            data: {
                currentHsCode,
                suggestion,
                potentialSavings
            },
            requiresHumanReview: !!suggestion,
            verdict: suggestion ? 'WARNING' : 'COMPLIANT', // Warning means "Opportunity Found"
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'TARIFF_CHECK',
                details: suggestion ? `Optimization found: Switch to ${suggestion.code}` : 'No better tariff found'
            }]
        };
    }
}
