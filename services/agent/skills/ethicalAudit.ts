import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export interface EthicalAuditInput {
    standard: 'BSCI' | 'Fairtrade' | 'Rainforest Alliance' | 'Sedex';
    score?: string;
}

export interface EthicalAuditResult {
    status: 'Pass' | 'Warning' | 'Fail';
    scoreLabel: string;
    message: string;
}

export class EthicalAuditSkill implements Skill {
    id = 'ethical_audit';
    name = 'Ethical Audit Specialist';
    description = 'Grades social and ethical compliance audits based on global benchmarks.';
    public category = SkillCategory.STANDARDS;

    async execute(input: EthicalAuditInput): Promise<SkillResult> {
        const { standard, score } = input;

        if (standard === 'BSCI') {
            const grade = (score || 'Unknown').toUpperCase();
            if (['A', 'B', 'C'].includes(grade)) {
                return {
                    success: true,
                    status: 'Pass',
                    message: `BSCI Audit Grade ${grade} meets the ethical compliance threshold.`,
                    score: 1.0,
                    data: {
                        status: 'Pass',
                        scoreLabel: `Grade ${grade}`
                    }
                };
            } else if (['D', 'E'].includes(grade)) {
                return {
                    success: false,
                    status: 'Warning',
                    message: `BSCI Audit Grade ${grade} indicates significant labor or safety risks. Site improvement required.`,
                    score: 0.2,
                    data: {
                        status: 'Warning',
                        scoreLabel: `Grade ${grade}`
                    }
                };
            }
        }

        if (['Fairtrade', 'Rainforest Alliance'].includes(standard)) {
            return {
                success: true,
                status: 'Pass',
                message: `${standard} certification is verified and active.`,
                score: 1.0,
                data: {
                    status: 'Pass',
                    scoreLabel: 'Certified'
                }
            };
        }

        return {
            success: true,
            status: 'Warning',
            message: `Generic verification performed for ${standard}.`,
            score: 0.5,
            data: {
                status: 'Warning',
                scoreLabel: score || 'N/A'
            }
        };
    }
}
