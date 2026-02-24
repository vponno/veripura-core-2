import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export interface ConflictResolutionInput {
    results: SkillResult[];
    context: {
        tradeOffType?: 'cost_vs_quality' | 'speed_vs_safety' | 'lowest_cost_vs_lowest_carbon' | 'compliance_vs_speed';
        priorityOverride?: 'cost' | 'speed' | 'compliance' | 'sustainability';
        [key: string]: any;
    };
}

export interface ConflictDetection {
    conflictingPairs: Array<{
        resultA: { id: string; message: string };
        resultB: { id: string; message: string };
        conflictType: string;
    }>;
    hasConflict: boolean;
}

export class ConflictResolutionSkill implements Skill {
    id = 'conflict_resolution';
    name = 'Conflict Resolution Arbiter';
    description = 'Arbitrates when multiple skills provide opposing recommendations (e.g., lowest cost vs. lowest carbon) using configurable prioritization logic.';
    public category = SkillCategory.CRISIS;

    private conflictRules: Record<string, { winner: string; loser: string; reason: string }> = {
        'lowest_cost_vs_lowest_carbon': {
            winner: 'sustainability',
            loser: 'cost',
            reason: 'EU Green Claims Directive prioritizes environmental impact in logistics decisions'
        },
        'compliance_vs_speed': {
            winner: 'compliance',
            loser: 'speed',
            reason: 'Regulatory compliance cannot be compromised for delivery speed'
        },
        'cost_vs_quality': {
            winner: 'quality',
            loser: 'cost',
            reason: 'Quality certifications are mandatory for market access'
        }
    };

    async execute(input: ConflictResolutionInput): Promise<SkillResult> {
        const { results, context } = input;
        
        if (!results || results.length < 2) {
            return {
                success: true,
                status: 'Pass',
                message: 'Insufficient results to detect conflicts.',
                score: 1.0,
                data: { conflicts: [], resolution: null }
            };
        }

        const detection = this.detectConflicts(results, context);
        
        if (!detection.hasConflict) {
            return {
                success: true,
                status: 'Pass',
                message: 'No conflicts detected between agent recommendations.',
                score: 1.0,
                data: { conflicts: [], resolution: null }
            };
        }

        const resolution = this.resolveConflicts(detection, context);

        return {
            success: true,
            status: resolution.hasConflict ? 'Warning' : 'Pass',
            message: resolution.explanation,
            score: resolution.confidence,
            data: {
                conflicts: detection.conflictingPairs,
                resolution: {
                    decision: resolution.decision,
                    reasoning: resolution.reasoning,
                    tradeOff: context.tradeOffType
                }
            }
        };
    }

    private detectConflicts(results: SkillResult[], context: any): ConflictDetection {
        const conflictingPairs: ConflictDetection['conflictingPairs'] = [];
        const costKeywords = ['savings', 'cost', 'cheapest', 'lowest price', 'duty'];
        const carbonKeywords = ['carbon', 'emissions', 'green', 'sustainable', 'scope'];
        const speedKeywords = ['fast', 'quick', 'expedited', 'transit time'];
        const complianceKeywords = ['compliance', 'regulation', 'certification', 'required'];

        for (let i = 0; i < results.length; i++) {
            for (let j = i + 1; j < results.length; j++) {
                const msgA = results[i].message.toLowerCase();
                const msgB = results[j].message.toLowerCase();

                const aHasCost = costKeywords.some(k => msgA.includes(k));
                const bHasCarbon = carbonKeywords.some(k => msgB.includes(k));
                const aHasCarbon = carbonKeywords.some(k => msgA.includes(k));
                const bHasCost = costKeywords.some(k => msgB.includes(k));

                if ((aHasCost && bHasCarbon) || (aHasCarbon && bHasCost)) {
                    conflictingPairs.push({
                        resultA: { id: `result_${i}`, message: results[i].message },
                        resultB: { id: `result_${j}`, message: results[j].message },
                        conflictType: 'lowest_cost_vs_lowest_carbon'
                    });
                }

                const aHasSpeed = speedKeywords.some(k => msgA.includes(k));
                const bHasCompliance = complianceKeywords.some(k => msgB.includes(k));
                const aHasCompliance = complianceKeywords.some(k => msgA.includes(k));
                const bHasSpeed = speedKeywords.some(k => msgB.includes(k));

                if ((aHasSpeed && bHasCompliance) || (aHasCompliance && bHasSpeed)) {
                    conflictingPairs.push({
                        resultA: { id: `result_${i}`, message: results[i].message },
                        resultB: { id: `result_${j}`, message: results[j].message },
                        conflictType: 'compliance_vs_speed'
                    });
                }
            }
        }

        return {
            conflictingPairs,
            hasConflict: conflictingPairs.length > 0
        };
    }

    private resolveConflicts(detection: ConflictDetection, context: any) {
        const tradeOffType = context.tradeOffType || this.inferTradeOff(detection);
        const priorityOverride = context.priorityOverride;

        let winner: string;
        let loser: string;
        let reason: string;

        if (priorityOverride) {
            winner = priorityOverride;
            loser = priorityOverride === 'cost' ? 'sustainability' : 
                   priorityOverride === 'sustainability' ? 'cost' :
                   priorityOverride === 'speed' ? 'compliance' : 'speed';
            reason = `Manual priority override: ${priorityOverride} specified by user.`;
        } else if (this.conflictRules[tradeOffType]) {
            const rule = this.conflictRules[tradeOffType];
            winner = rule.winner;
            loser = rule.loser;
            reason = rule.reason;
        } else {
            winner = 'compliance';
            loser = 'speed';
            reason = 'Default: Compliance takes precedence over other factors.';
        }

        return {
            hasConflict: detection.conflictingPairs.length > 0,
            decision: winner,
            reasoning: reason,
            confidence: 0.85,
            explanation: `Conflict resolved: ${winner.toUpperCase()} prioritized over ${loser}. Reason: ${reason}`
        };
    }

    private inferTradeOff(detection: ConflictDetection): string {
        const types = detection.conflictingPairs.map(c => c.conflictType);
        if (types.includes('lowest_cost_vs_lowest_carbon')) return 'lowest_cost_vs_lowest_carbon';
        if (types.includes('compliance_vs_speed')) return 'compliance_vs_speed';
        return 'cost_vs_quality';
    }
}
