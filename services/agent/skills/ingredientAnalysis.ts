import { Skill, SkillResult } from './skillRegistry';

export class IngredientAnalysisSkill implements Skill {
    id = 'ingredient_analysis';
    name = 'Ingredient Analysis';
    description = 'Analyzes ingredient lists for banned substances or allergens.';

    async execute(payload: any): Promise<SkillResult> {
        const { ingredients, destination } = payload;

        // Mock Database of Banned Substances
        const bannedDatabase = [
            { id: 'E171', name: 'Titanium Dioxide', restrictedIn: ['EU', 'Netherlands', 'France'] },
            { id: 'E127', name: 'Erythrosine', restrictedIn: ['USA'] },
            { id: 'Potassium Bromate', name: 'Potassium Bromate', restrictedIn: ['EU', 'Canada', 'China'] }
        ];

        const detected = bannedDatabase.filter(b =>
            (ingredients || '').includes(b.id) || (ingredients || '').toLowerCase().includes(b.name.toLowerCase())
        );

        const violations = detected.filter(d => d.restrictedIn.some((r: string) => (destination || '').includes(r)));

        if (violations.length > 0) {
            return {
                success: true,
                status: 'Fail',
                message: `Banned substances detected for ${destination}: ${violations.map(v => v.name).join(', ')}`,
                data: { violations },
                score: 0
            };
        }

        return { success: true, status: 'Pass', message: 'No banned substances detected.', score: 1.0 };
    }
}
