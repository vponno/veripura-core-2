import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

export class ContainerSealIntegritySkill implements ISkill {
    public id = 'container_seal_integrity_skill';
    public name = 'Container Seal Guard';
    public category = SkillCategory.IOT;
    public description = 'Validates seal numbers against B/L and detects potential tampering events during transit.';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;
        const containerNumber = metadata.containerNumber || metadata.shipment?.containerNumber;
        const sealNumber = metadata.sealNumber || metadata.shipment?.sealNumber;
        const billOfLading = metadata.billOfLading || metadata.shipment?.billOfLading;
        const events = metadata.events || metadata.shipment?.events || [];

        const alerts: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];
        let severity: 'info' | 'warning' | 'critical' = 'info';

        if (!sealNumber) {
            return {
                success: false,
                confidence: 0,
                data: null,
                requiresHumanReview: true,
                verdict: 'UNKNOWN',
                auditLog: [{ timestamp: new Date().toISOString(), action: 'MISSING_DATA', details: 'No seal number provided' }]
            };
        }

        // Seal Matching Logic
        if (billOfLading && billOfLading.sealNumber !== sealNumber) {
            alerts.push(`SEAL MISMATCH: B/L shows ${billOfLading.sealNumber}, container has ${sealNumber}`);
            severity = 'critical';
        }

        // Event Analysis
        const tamperEvents = events.filter((e: any) => e.eventType === 'tampered');
        if (tamperEvents.length > 0) {
            tamperEvents.forEach((e: any) => alerts.push(`TAMPER DETECTED at ${e.location}: ${e.notes}`));
            severity = 'critical';
        }

        const sealBreakEvents = events.filter((e: any) => e.eventType === 'opened');
        if (sealBreakEvents.length > 1) {
            alerts.push(`MULTIPLE SEAL BREAKS: ${sealBreakEvents.length} opened events recorded`);
            severity = 'critical';
        }

        // Transit Time Analysis
        const transitTime = this.calculateTransitTime(events);
        if (transitTime > 45) { // Simple threshold for now
            warnings.push(`Long transit time: ${transitTime} days`);
        }

        const startLocation = events[0]?.location;
        const endLocation = events[events.length - 1]?.location;

        // Construct Result
        const success = severity !== 'critical';
        const verdict = severity === 'critical' ? 'NON_COMPLIANT' : (warnings.length > 0 ? 'WARNING' : 'COMPLIANT');

        return {
            success,
            confidence: events.length > 0 ? 0.9 : 0.5,
            data: {
                containerNumber,
                sealNumber,
                alerts,
                warnings,
                transitTime,
                route: `${startLocation} -> ${endLocation}`
            },
            requiresHumanReview: !success || warnings.length > 0,
            verdict,
            auditLog: [{
                timestamp: new Date().toISOString(),
                action: 'ANALYSIS_COMPLETE',
                details: `Analyzed ${events.length} events. Result: ${verdict}`
            }],
            errors: alerts
        };
    }

    async validateContext(context: SkillContext): Promise<boolean> {
        return !!(context.metadata.containerNumber || context.metadata.shipment?.containerNumber);
    }

    private calculateTransitTime(events: any[]): number {
        if (!events || events.length < 2) return 0;
        const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const first = new Date(sorted[0].timestamp);
        const last = new Date(sorted[sorted.length - 1].timestamp);
        return Math.round((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
    }
}
