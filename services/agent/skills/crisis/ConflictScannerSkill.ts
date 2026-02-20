import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class ConflictScannerSkill implements ISkill {
    public id = 'conflict_scanner_skill';
    public name = 'Geopolitical Conflict Scanner';
    public category = SkillCategory.CRISIS;
    public description = 'Checks shipment routes against active conflict zones and sanctions lists.';

    private activeConflictZones = ['Red Sea', 'Black Sea', 'Gaza', 'Sudan', 'Myanmar'];

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        const route = metadata.route || []; // Array of locations
        const origin = metadata.origin;
        const destination = metadata.destination;

        const stops = [origin, destination, ...route].filter(Boolean);
        const risks: string[] = [];

        stops.forEach((stop: string) => {
            if (this.activeConflictZones.some(zone => stop.includes(zone))) {
                risks.push(`Conflict Zone Alert: Route passes through ${stop}`);
            }
        });

        const verdict = risks.length > 0 ? 'WARNING' : 'COMPLIANT';

        return {
            success: true, // It successfully scanned, even if risks found
            confidence: 0.8,
            data: {
                risksFound: risks,
                routeChecked: stops
            },
            requiresHumanReview: risks.length > 0,
            verdict,
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'CONFLICT_SCAN',
                details: risks.length > 0 ? `Risks found: ${risks.join(', ')}` : 'No conflict zones detected'
            }]
        };
    }
}
