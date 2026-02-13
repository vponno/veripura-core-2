import { Skill, SkillResult } from './skillRegistry';

export interface ChainStep {
    skillId: string;
    input: any;
    condition?: {
        onResult: 'success' | 'failure' | 'warning';
        goto?: string;
    };
}

export interface SkillChainingInput {
    workflowName: string;
    startStep: string;
    steps: Record<string, ChainStep>;
    initialInput: any;
}

interface ExecutionContext {
    currentStep: string;
    results: Record<string, SkillResult>;
    halted: boolean;
    haltReason?: string;
}

export class SkillChainingSkill implements Skill {
    id = 'skill_chaining';
    name = 'Workflow Orchestrator';
    description = 'Orchestrates complex multi-skill workflows with conditional branching (e.g., "If ESG fails, trigger Legal Review").';

    async execute(input: SkillChainingInput): Promise<SkillResult> {
        const { workflowName, startStep, steps, initialInput } = input;
        
        const context: ExecutionContext = {
            currentStep: startStep,
            results: {},
            halted: false
        };

        try {
            await this.executeWorkflow(steps, initialInput, context);
            
            return {
                success: !context.halted,
                status: context.halted ? 'Warning' : 'Pass',
                message: context.halted 
                    ? `Workflow '${workflowName}' halted: ${context.haltReason}`
                    : `Workflow '${workflowName}' completed successfully.`,
                score: Object.keys(context.results).length > 0 
                    ? Object.values(context.results).reduce((acc, r) => acc * r.score, 1) 
                    : 0,
                data: {
                    workflow: workflowName,
                    stepsExecuted: Object.keys(context.results),
                    results: context.results,
                    halted: context.halted,
                    haltReason: context.haltReason
                }
            };
        } catch (error: any) {
            return {
                success: false,
                status: 'Fail',
                message: `Workflow '${workflowName}' failed: ${error.message}`,
                score: 0,
                data: {
                    workflow: workflowName,
                    error: error.message,
                    partialResults: context.results
                }
            };
        }
    }

    private async executeWorkflow(
        steps: Record<string, ChainStep>, 
        initialInput: any, 
        context: ExecutionContext
    ): Promise<void> {
        let currentInput = initialInput;

        while (context.currentStep && !context.halted) {
            const step = steps[context.currentStep];
            
            if (!step) {
                context.halted = true;
                context.haltReason = `Step '${context.currentStep}' not found in workflow`;
                break;
            }

            const skillResult = await this.simulateSkillExecution(step.skillId, step.input || currentInput);
            
            context.results[context.currentStep] = skillResult;

            if (step.condition) {
                const shouldBranch = this.evaluateCondition(step.condition, skillResult);
                
                if (shouldBranch && step.condition.goto) {
                    context.currentStep = step.condition.goto;
                    continue;
                } else if (!shouldBranch) {
                    context.halted = true;
                    context.haltReason = `Condition not met for step '${context.currentStep}'`;
                    break;
                }
            }

            const nextStepId = this.getNextStep(context.currentStep, steps);
            if (nextStepId) {
                context.currentStep = nextStepId;
                currentInput = skillResult.data;
            } else {
                break;
            }
        }
    }

    private async simulateSkillExecution(skillId: string, input: any): Promise<SkillResult> {
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const mockResponses: Record<string, SkillResult> = {
            'regulatory_check': { success: true, status: 'Pass', message: 'Regulatory check passed', score: 1.0, data: {} },
            'esg_score': { success: true, status: 'Pass', message: 'ESG score: 85/100', score: 0.85, data: {} },
            'forced_labor': { success: true, status: 'Pass', message: 'No forced labor indicators', score: 1.0, data: {} },
            'legal_review': { success: true, status: 'Pass', message: 'Legal review: Approved', score: 1.0, data: {} }
        };

        return mockResponses[skillId] || { success: true, status: 'Pass', message: `Skill ${skillId} executed`, score: 1.0, data: {} };
    }

    private evaluateCondition(condition: ChainStep['condition'], result: SkillResult): boolean {
        if (!condition) return true;

        switch (condition.onResult) {
            case 'success':
                return result.success && result.status === 'Pass';
            case 'failure':
                return !result.success || result.status === 'Fail';
            case 'warning':
                return result.status === 'Warning';
            default:
                return true;
        }
    }

    private getNextStep(currentStepId: string, steps: Record<string, ChainStep>): string | null {
        const stepKeys = Object.keys(steps);
        const currentIndex = stepKeys.indexOf(currentStepId);
        
        if (currentIndex === -1 || currentIndex === stepKeys.length - 1) {
            return null;
        }
        
        return stepKeys[currentIndex + 1];
    }
}
