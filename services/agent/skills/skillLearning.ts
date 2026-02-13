import { Skill, SkillResult } from './skillRegistry';

export interface SkillFeedback {
    skillId: string;
    input: any;
    output: SkillResult;
    outcome: 'true_positive' | 'false_positive' | 'true_negative' | 'false_negative';
    humanCorrected?: boolean;
    correctedOutput?: any;
    timestamp: string;
    consignmentId?: string;
}

export interface LearnedAdjustment {
    skillId: string;
    parameter: string;
    adjustment: number | string | boolean;
    confidence: number;
    reason: string;
    basedOnSamples: number;
    updatedAt: string;
}

export interface SkillPerformance {
    skillId: string;
    totalExecutions: number;
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
    accuracy: number;
    precision: number;
    recall: number;
    humanCorrections: number;
    lastUpdated: string;
}

export class SkillLearningEngine {
    private feedbackStore: SkillFeedback[] = [];
    private adjustments: Map<string, LearnedAdjustment[]> = new Map();
    private performanceMetrics: Map<string, SkillPerformance> = new Map();

    async recordFeedback(feedback: SkillFeedback): Promise<void> {
        this.feedbackStore.push({
            ...feedback,
            timestamp: feedback.timestamp || new Date().toISOString()
        });

        if (feedback.humanCorrected) {
            await this.processHumanCorrection(feedback);
        }

        await this.updatePerformanceMetrics(feedback.skillId);
        
        if (this.feedbackStore.length > 10000) {
            this.feedbackStore = this.feedbackStore.slice(-5000);
        }
    }

    async recordOutcome(
        skillId: string,
        consignmentId: string,
        input: any,
        output: SkillResult,
        actualOutcome: 'true_positive' | 'false_positive' | 'true_negative' | 'false_negative'
    ): Promise<void> {
        await this.recordFeedback({
            skillId,
            input,
            output,
            outcome: actualOutcome,
            consignmentId,
            timestamp: new Date().toISOString()
        });
    }

    private async processHumanCorrection(feedback: SkillFeedback): Promise<void> {
        const skillId = feedback.skillId;
        const currentAdjustments = this.adjustments.get(skillId) || [];

        const adjustment: LearnedAdjustment = {
            skillId,
            parameter: 'threshold',
            adjustment: feedback.correctedOutput?.thresholdAdjustment || 0,
            confidence: 0.8,
            reason: `Human correction: ${feedback.output.message} → ${feedback.correctedOutput?.message}`,
            basedOnSamples: this.getSampleCount(skillId),
            updatedAt: new Date().toISOString()
        };

        const existingIndex = currentAdjustments.findIndex(a => a.parameter === 'threshold');
        if (existingIndex >= 0) {
            const existing = currentAdjustments[existingIndex];
            adjustment.confidence = Math.min(0.95, existing.confidence + 0.1);
            adjustment.basedOnSamples = existing.basedOnSamples + 1;
            currentAdjustments[existingIndex] = adjustment;
        } else {
            currentAdjustments.push(adjustment);
        }

        this.adjustments.set(skillId, currentAdjustments);
    }

    private async updatePerformanceMetrics(skillId: string): Promise<void> {
        const feedback = this.feedbackStore.filter(f => f.skillId === skillId);
        
        const metrics: SkillPerformance = {
            skillId,
            totalExecutions: feedback.length,
            truePositives: feedback.filter(f => f.outcome === 'true_positive').length,
            falsePositives: feedback.filter(f => f.outcome === 'false_positive').length,
            trueNegatives: feedback.filter(f => f.outcome === 'true_negative').length,
            falseNegatives: feedback.filter(f => f.outcome === 'false_negative').length,
            accuracy: 0,
            precision: 0,
            recall: 0,
            humanCorrections: feedback.filter(f => f.humanCorrected).length,
            lastUpdated: new Date().toISOString()
        };

        const tp = metrics.truePositives;
        const fp = metrics.falsePositives;
        const tn = metrics.trueNegatives;
        const fn = metrics.falseNegatives;

        metrics.accuracy = metrics.totalExecutions > 0 ? (tp + tn) / metrics.totalExecutions : 0;
        metrics.precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
        metrics.recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;

        this.performanceMetrics.set(skillId, metrics);
    }

    getPerformance(skillId: string): SkillPerformance | undefined {
        return this.performanceMetrics.get(skillId);
    }

    getAdjustments(skillId: string): LearnedAdjustment[] {
        return this.adjustments.get(skillId) || [];
    }

    getApplicableAdjustments(skillId: string): Record<string, any> {
        const adjustments = this.getAdjustments(skillId);
        const result: Record<string, any> = {};
        
        adjustments.forEach(adj => {
            if (adj.confidence > 0.5) {
                result[adj.parameter] = adj.adjustment;
            }
        });
        
        return result;
    }

    private getSampleCount(skillId: string): number {
        return this.feedbackStore.filter(f => f.skillId === skillId).length;
    }

    getAllPerformance(): SkillPerformance[] {
        return Array.from(this.performanceMetrics.values());
    }

    async retrainFromFeedback(skillId: string): Promise<{
        recommendedThreshold: number;
        confidence: number;
        rationale: string;
    }> {
        const metrics = this.getPerformance(skillId);
        if (!metrics || metrics.totalExecutions < 10) {
            return {
                recommendedThreshold: 0.5,
                confidence: 0,
                rationale: 'Insufficient data for retraining'
            };
        }

        const precision = metrics.precision;
        const recall = metrics.recall;
        
        let recommendedThreshold = 0.5;
        if (precision < 0.7) {
            recommendedThreshold = Math.min(0.8, 0.5 + (0.7 - precision) * 0.5);
        } else if (recall < 0.7) {
            recommendedThreshold = Math.max(0.3, 0.5 - (0.7 - recall) * 0.5);
        }

        return {
            recommendedThreshold,
            confidence: metrics.accuracy,
            rationale: `Based on ${metrics.totalExecutions} samples: precision=${precision.toFixed(2)}, recall=${recall.toFixed(2)}`
        };
    }
}

export const skillLearningEngine = new SkillLearningEngine();

export async function executeSkillWithLearning(
    skill: Skill,
    input: any,
    options?: {
        recordFeedback?: boolean;
        consignmentId?: string;
    }
): Promise<SkillResult> {
    const adjustments = skillLearningEngine.getApplicableAdjustments(skill.id);
    
    const adjustedInput = {
        ...input,
        _learnedAdjustments: adjustments
    };

    const result = await skill.execute(adjustedInput);

    if (options?.recordFeedback && options?.consignmentId) {
        await skillLearningEngine.recordOutcome(
            skill.id,
            options.consignmentId,
            input,
            result,
            result.status === 'Fail' ? 'true_positive' : 'true_negative'
        );
    }

    return result;
}
