import { Skill, SkillResult } from './skillRegistry';
import { skillLearningEngine, executeSkillWithLearning } from './skillLearning';

export interface SubAgentContext {
    id: string;
    name: string;
}

export async function executeSkillWithFeedback(
    skillId: string,
    skillGetter: () => Skill | undefined,
    input: any,
    subAgentContext: SubAgentContext,
    consignmentId?: string
): Promise<{ result: SkillResult | null; skillAvailable: boolean }> {
    const skill = skillGetter();
    
    if (!skill) {
        console.warn(`[SubAgent:${subAgentContext.name}] Skill not found: ${skillId}`);
        return { result: null, skillAvailable: false };
    }

    const adjustments = skillLearningEngine.getApplicableAdjustments(skillId);
    
    const adjustedInput = {
        ...input,
        _learnedAdjustments: adjustments,
        _skillId: skillId,
        _subAgentId: subAgentContext.id
    };

    const result = await skill.execute(adjustedInput);

    if (consignmentId) {
        await skillLearningEngine.recordOutcome(
            skillId,
            consignmentId,
            input,
            result,
            result.status === 'Fail' ? 'true_positive' : 'true_negative'
        );
    }

    return { result, skillAvailable: true };
}

export { skillLearningEngine, executeSkillWithLearning };
