import { Skill, SkillResult } from './skillRegistry';

export class DocumentAnalysisSkill implements Skill {
    id = 'document_analysis';
    name = 'Document Text Analysis';
    description = 'Analyzes document text for specific keywords, clauses, or discrepancies.';

    async execute(payload: any): Promise<SkillResult> {
        const { documentType, textContent, keywords, mode } = payload;

        if (!textContent) {
            return { success: false, status: 'Error', message: 'No text content provided for analysis.', score: 0 };
        }

        const text = (textContent as string).toLowerCase();

        if (mode === 'keyword_search') {
            const hits = (keywords as string[]).filter(k => text.includes(k.toLowerCase()));

            if (hits.length > 0) {
                return {
                    success: true,
                    status: 'Match',
                    message: `Keywords detected: ${hits.join(', ')}`,
                    data: { matches: hits },
                    score: 1.0
                };
            }
            return { success: true, status: 'Clean', message: 'No keywords detected.', score: 0 };
        }

        // Logistics "Dirty" Clause Detection
        if (mode === 'logistics_clauses') {
            const dirtyKeywords = ['damaged', 'leaking', 'stained', 'shortage', 're-packed', 'torn', 'wet', 'infested'];
            const hits = dirtyKeywords.filter(k => text.includes(k));

            if (hits.length > 0) {
                return {
                    success: true,
                    status: 'Fail',
                    message: `Adverse clauses detected via text analysis: ${hits.join(', ')}`,
                    data: { matches: hits },
                    score: 0
                };
            }
            return { success: true, status: 'Pass', message: 'Document is clean of adverse notations.', score: 1.0 };
        }

        return { success: false, status: 'Error', message: `Unknown analysis mode: ${mode}`, score: 0 };
    }
}
