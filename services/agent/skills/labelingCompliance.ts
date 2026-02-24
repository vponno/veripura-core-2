import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export class LabelingComplianceSkill implements Skill {
    id = 'labeling_compliance';
    name = 'Labeling Compliance';
    description = 'Checks for mandatory label information like allergens and net weight.';
    public category = SkillCategory.REGULATORY;

    async execute(payload: any): Promise<SkillResult> {
        const { labelText, jurisdiction } = payload;
        const missing: string[] = [];

        // Mock Rules
        if (!labelText.toLowerCase().includes('net weight') && !labelText.toLowerCase().includes('net wt')) {
            missing.push('Net Weight');
        }

        if (jurisdiction === 'EU' && !labelText.includes('Allergen')) {
            // overly simple check
            missing.push('Allergen Declaration (EU)');
        }

        if (missing.length > 0) {
            return {
                success: true,
                status: 'Fail',
                message: `Labeling violations detected: Missing ${missing.join(', ')}`,
                data: { missing },
                score: 0
            };
        }

        return { success: true, status: 'Pass', message: 'Label appears compliant.', score: 1.0 };
    }
}
