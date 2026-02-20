import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class PastPerformanceSkill implements ISkill {
    public id = 'past_performance_skill';
    public name = 'Historical Performance Analyzer';
    public category = SkillCategory.HISTORICAL;
    public description = 'Analyzes supplier historical compliance data to predict risk.';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        const supplierId = metadata.supplierId || metadata.shipment?.supplierId;

        if (!supplierId) {
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: false,
                verdict: 'UNKNOWN',
                auditLog: [{ timestamp: new Date().toISOString(), action: 'SKIPPED', details: 'No supplier ID provided' }]
            };
        }

        // Mock Historical Data Fetch
        // In production, this queries the historical compliance database
        const history = await this.fetchHistory(supplierId);

        let verdict: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' = 'COMPLIANT';
        if (history.failRate > 0.1) verdict = 'WARNING';
        if (history.failRate > 0.3) verdict = 'NON_COMPLIANT';

        return {
            success: true,
            confidence: 0.85,
            data: history,
            requiresHumanReview: verdict !== 'COMPLIANT',
            verdict,
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'HISTORY_CHECK',
                details: `Supplier ${supplierId} fail rate: ${(history.failRate * 100).toFixed(1)}%`
            }]
        };
    }

    private async fetchHistory(id: string): Promise<{ totalShipments: number, failRate: number, lastIncident?: string }> {
        // Simulator
        if (id === 'SUP-BAD') return { totalShipments: 50, failRate: 0.4, lastIncident: 'UserId tampering' };
        if (id === 'SUP-RISKY') return { totalShipments: 20, failRate: 0.15, lastIncident: 'Documentation error' };
        return { totalShipments: 100, failRate: 0.02 };
    }
}
