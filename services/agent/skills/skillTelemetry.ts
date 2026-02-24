import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export interface TelemetryEvent {
    timestamp: string;
    skillId: string;
    skillName: string;
    inputSize: number;
    outputSize: number;
    latencyMs: number;
    tokenCount?: number;
    success: boolean;
    error?: string;
    metadata?: Record<string, any>;
}

export interface SkillTelemetryInput {
    action: 'log' | 'query' | 'summary';
    events?: TelemetryEvent[];
    query?: {
        skillId?: string;
        timeRange?: { start: string; end: string };
        limit?: number;
    };
}

export class SkillTelemetrySkill implements Skill {
    id = 'skill_telemetry';
    name = 'Skill Telemetry Collector';
    description = 'Logs inputs, outputs, latency, and token costs for every skill execution to enable observability and performance analysis.';
    public category = SkillCategory.META;

    private telemetryStore: TelemetryEvent[] = [];

    async execute(input: SkillTelemetryInput): Promise<SkillResult> {
        const { action, events, query } = input;

        switch (action) {
            case 'log':
                if (!events || events.length === 0) {
                    return {
                        success: false,
                        status: 'Fail',
                        message: 'No telemetry events provided for logging',
                        score: 0
                    };
                }
                this.logEvents(events);
                return {
                    success: true,
                    status: 'Pass',
                    message: `Logged ${events.length} telemetry events`,
                    score: 1.0,
                    data: { eventsLogged: events.length }
                };

            case 'query':
                const results = this.queryEvents(query || {});
                return {
                    success: true,
                    status: 'Pass',
                    message: `Query returned ${results.length} events`,
                    score: 1.0,
                    data: { events: results, count: results.length }
                };

            case 'summary':
                const summary = this.generateSummary();
                return {
                    success: true,
                    status: 'Pass',
                    message: 'Telemetry summary generated',
                    score: 1.0,
                    data: summary
                };

            default:
                return {
                    success: false,
                    status: 'Fail',
                    message: `Unknown action: ${action}`,
                    score: 0
                };
        }
    }

    private logEvents(events: TelemetryEvent[]): void {
        events.forEach(event => {
            event.timestamp = event.timestamp || new Date().toISOString();
            this.telemetryStore.push(event);
        });

        if (this.telemetryStore.length > 10000) {
            this.telemetryStore = this.telemetryStore.slice(-10000);
        }
    }

    private queryEvents(query: SkillTelemetryInput['query']): TelemetryEvent[] {
        let results = [...this.telemetryStore];

        if (query?.skillId) {
            results = results.filter(e => e.skillId === query.skillId);
        }

        if (query?.timeRange) {
            const start = new Date(query.timeRange.start).getTime();
            const end = new Date(query.timeRange.end).getTime();
            results = results.filter(e => {
                const ts = new Date(e.timestamp).getTime();
                return ts >= start && ts <= end;
            });
        }

        if (query?.limit) {
            results = results.slice(-query.limit);
        }

        return results;
    }

    private generateSummary() {
        const skills = new Map<string, { count: number; successCount: number; totalLatency: number }>();

        this.telemetryStore.forEach(event => {
            const existing = skills.get(event.skillId) || { count: 0, successCount: 0, totalLatency: 0 };
            existing.count++;
            if (event.success) existing.successCount++;
            existing.totalLatency += event.latencyMs;
            skills.set(event.skillId, existing);
        });

        const skillSummaries: Record<string, any> = {};
        
        skills.forEach((stats, skillId) => {
            skillSummaries[skillId] = {
                executionCount: stats.count,
                successRate: stats.count > 0 ? (stats.successCount / stats.count) * 100 : 0,
                avgLatencyMs: stats.count > 0 ? stats.totalLatency / stats.count : 0,
                totalLatencyMs: stats.totalLatency
            };
        });

        return {
            totalExecutions: this.telemetryStore.length,
            skills: skillSummaries,
            timeRange: {
                oldest: this.telemetryStore[0]?.timestamp,
                newest: this.telemetryStore[this.telemetryStore.length - 1]?.timestamp
            }
        };
    }
}
