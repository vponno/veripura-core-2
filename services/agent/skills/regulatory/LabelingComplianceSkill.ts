import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class LabelingComplianceSkill implements ISkill {
    public id = 'labeling_compliance_skill';
    public name = 'Labeling Compliance Validator';
    public category = SkillCategory.REGULATORY;
    public description = 'Verifies that product labeling meets destination country requirements (e.g., CE mark, FDA nutrition facts).';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        const destination = metadata.destination || metadata.shipment?.destination;
        const product = metadata.product || metadata.shipment?.product;
        const files = context.files || [];

        const requirements = this.getRequirements(destination, product);
        const missing: string[] = [];

        // In a real scenario, this would use OCR (via DocumentAnalysis) to check the label image
        // For now, we simulate check based on metadata or mock "visual" check

        // Simulating OCR findings from metadata or previous skills
        const detectedLabels = metadata.detectedLabels || [];

        requirements.forEach(req => {
            if (!detectedLabels.includes(req)) {
                missing.push(req);
            }
        });

        const verdict = missing.length > 0 ? 'NON_COMPLIANT' : 'COMPLIANT';

        return {
            success: verdict === 'COMPLIANT',
            confidence: 0.8,
            data: {
                destination,
                product,
                requiredLabels: requirements,
                missingLabels: missing
            },
            requiresHumanReview: missing.length > 0,
            verdict,
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'LABEL_CHECK',
                details: missing.length > 0 ? `Missing labels: ${missing.join(', ')}` : 'All required labels present'
            }]
        };
    }

    private getRequirements(destination: string, product: string): string[] {
        const reqs: string[] = [];
        if (destination?.includes('EU') || destination?.includes('Rotterdam') || destination?.includes('Germany')) {
            reqs.push('CE Mark');
            if (product?.toLowerCase().includes('food')) reqs.push('EU Nutrition Table');
        }
        if (destination?.includes('US')) {
            reqs.push('Made in Origin');
            if (product?.toLowerCase().includes('food')) reqs.push('FDA Nutrition Facts');
        }
        return reqs;
    }
}
