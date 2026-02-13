import { Skill, SkillResult } from './skillRegistry';

export interface ContainerSealInput {
    containerNumber: string;
    sealNumber: string;
    events: Array<{
        timestamp: string;
        location: string;
        eventType: 'loaded' | 'sealed' | 'departed' | 'arrived' | 'opened' | 'inspected' | 'tampered';
        sealIntact?: boolean;
        notes?: string;
    }>;
    billOfLading?: {
        sealNumber: string;
        issueDate: string;
    };
}

export class ContainerSealIntegritySkill implements Skill {
    id = 'container_seal_integrity';
    name = 'Container Seal Guard';
    description = 'Validates seal numbers against B/L and detects potential tampering events during transit.';

    async execute(input: ContainerSealInput): Promise<SkillResult> {
        const { containerNumber, sealNumber, events, billOfLading } = input;

        const alerts: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];
        let severity: 'info' | 'warning' | 'critical' = 'info';
        let status = 'Pass';

        if (!sealNumber) {
            alerts.push('No seal number provided');
            severity = 'critical';
            status = 'Fail';
        }

        if (billOfLading && billOfLading.sealNumber !== sealNumber) {
            alerts.push(`SEAL MISMATCH: B/L shows ${billOfLading.sealNumber}, container has ${sealNumber}`);
            severity = 'critical';
            status = 'Fail';
        }

        const tamperEvents = events.filter(e => e.eventType === 'tampered');
        if (tamperEvents.length > 0) {
            tamperEvents.forEach(e => {
                alerts.push(`TAMPER DETECTED at ${e.location} on ${e.timestamp}: ${e.notes || 'No details'}`);
            });
            severity = 'critical';
            status = 'Fail';
        }

        const sealBreakEvents = events.filter(e => e.eventType === 'opened');
        if (sealBreakEvents.length > 1) {
            alerts.push(`MULTIPLE SEAL BREAKS: ${sealBreakEvents.length} opened events recorded`);
            severity = 'critical';
            status = 'Fail';
        } else if (sealBreakEvents.length === 1) {
            const breakEvent = sealBreakEvents[0];
            const sealedEvent = events.find(e => e.eventType === 'sealed');
            if (sealedEvent && new Date(breakEvent.timestamp) < new Date(sealedEvent.timestamp)) {
                warnings.push('Seal broken before initial sealing event - investigate');
            } else {
                info.push(`Seal properly broken at destination: ${breakEvent.location}`);
            }
        }

        events.forEach(event => {
            if (event.sealIntact === false) {
                warnings.push(`Seal integrity issue at ${event.location}: ${event.notes || 'Seal not intact'}`);
                if (severity !== 'critical') severity = 'warning';
                if (status !== 'Fail') status = 'Warning';
            }
        });

        const transitTime = this.calculateTransitTime(events);
        const expectedMaxTransit = this.getExpectedTransitTime(events[0]?.location, events[events.length - 1]?.location);
        
        if (expectedMaxTransit && transitTime > expectedMaxTransit * 1.5) {
            warnings.push(`UNUSUAL TRANSIT TIME: ${transitTime} days vs expected ${expectedMaxTransit} days - verify no delays indicating issues`);
        }

        return {
            success: status !== 'Fail',
            status,
            message: severity === 'critical' 
                ? `SEAL INTEGRITY ALERT: ${alerts.join('. ')}`
                : warnings.length > 0 
                    ? `Seal validation warnings: ${warnings.join('. ')}`
                    : `Seal integrity verified: ${sealNumber}`,
            score: severity === 'critical' ? 0 : warnings.length > 0 ? 0.7 : 1.0,
            data: {
                containerNumber,
                sealNumber,
                billOfLadingSeal: billOfLading?.sealNumber,
                alerts,
                warnings,
                info,
                transitTimeDays: transitTime,
                eventsSummary: {
                    totalEvents: events.length,
                    tamperAttempts: tamperEvents.length,
                    sealBreaks: sealBreakEvents.length
                },
                recommendation: this.getRecommendation(severity, alerts, warnings)
            }
        };
    }

    private calculateTransitTime(events: ContainerSealInput['events']): number {
        if (events.length < 2) return 0;
        
        const sorted = [...events].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        const first = new Date(sorted[0].timestamp);
        const last = new Date(sorted[sorted.length - 1].timestamp);
        
        return Math.round((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
    }

    private getExpectedTransitTime(origin?: string, destination?: string): number | null {
        if (!origin || !destination) return null;

        const routes: Record<string, number> = {
            'CN-US': 21,
            'CN-EU': 28,
            'US-EU': 14,
            'EU-US': 16,
            'ASIA-US': 18,
            'ASIA-EU': 25
        };

        const key = `${origin.substring(0, 2).toUpperCase()}-${destination.substring(0, 2).toUpperCase()}`;
        return routes[key] || null;
    }

    private getRecommendation(severity: string, alerts: string[], warnings: string[]): string {
        if (severity === 'critical') {
            return 'DO NOT ACCEPT: Container seal compromised. Request customs inspection and file claim.';
        }
        if (warnings.length > 0) {
            return 'REVIEW REQUIRED: Verify seal integrity at next checkpoint. Document any discrepancies.';
        }
        return 'ACCEPT: Seal integrity confirmed. Standard processing.';
    }
}
