import { Skill, SkillResult } from './skillRegistry';

export class WatchlistScentSkill implements Skill {
    id = 'watchlist_scent';
    name = 'Watchlist Scent';
    description = 'Detects entities present on global sanctions and watchlists.';

    async execute(input: { text: string }): Promise<SkillResult> {
        const text = input.text;

        try {
            // Lazy load service to avoid circular dependencies in skill registry
            const { sanctionsService } = await import('../../sanctionsService');

            const hits = await sanctionsService.checkSanctions(text);

            const matches = hits.map(hit => ({
                entity: hit.entity,
                list: hit.list,
                confidence: hit.score,
                details: hit.program ? `Program: ${hit.program}` : hit.reason
            }));

            return {
                success: true,
                status: matches.length > 0 ? 'Match' : 'Clean',
                message: matches.length > 0 ? 'Watchlist matches found.' : 'No matches found.',
                score: matches.length > 0 ? 0 : 1.0,
                data: { matches }
            };
        } catch (error) {
            console.error("Watchlist Scent Execution Failed:", error);
            return {
                success: false,
                status: 'Error',
                message: 'Watchlist check failed.',
                score: 0,
                data: { matches: [] }
            };
        }
    }
}
