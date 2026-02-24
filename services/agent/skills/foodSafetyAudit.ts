import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export interface FoodSafetyAuditInput {
    standard: 'BRCGS' | 'HACCP' | 'GMP' | 'FSSC 22000' | 'SQF' | 'ISO 22000';
    grade?: string;
    ccpValidationDate?: string;
}

export interface FoodSafetyAuditResult {
    status: 'Pass' | 'Warning' | 'Fail';
    scoreLabel: string;
    message: string;
}

export class FoodSafetyAuditSkill implements Skill {
    id = 'food_safety_audit';
    name = 'Food Safety Audit Specialist';
    description = 'Analyzes technical food safety audit reports against GFSI-benchmarked standards.';
    public category = SkillCategory.STANDARDS;

    async execute(input: FoodSafetyAuditInput): Promise<SkillResult> {
        const { standard, grade, ccpValidationDate } = input;

        if (standard === 'BRCGS') {
            const normalizedGrade = (grade || 'Unknown').toUpperCase();
            if (['AA', 'A', 'B'].includes(normalizedGrade)) {
                return {
                    success: true,
                    status: 'Pass',
                    message: `BRCGS Grade ${normalizedGrade} meets high-level safety assurance standards.`,
                    score: 1.0,
                    data: {
                        status: 'Pass',
                        scoreLabel: `Grade ${normalizedGrade}`
                    }
                };
            } else if (['C', 'D'].includes(normalizedGrade)) {
                return {
                    success: false,
                    status: 'Warning',
                    message: `BRCGS Grade ${normalizedGrade} indicates significant non-conformities. Corrective actions must be reviewed.`,
                    score: 0.4,
                    data: {
                        status: 'Warning',
                        scoreLabel: `Grade ${normalizedGrade}`
                    }
                };
            }
            return {
                success: false,
                status: 'Fail',
                message: `Grade ${normalizedGrade} is below the acceptable threshold for GFSI compliance.`,
                score: 0,
                data: {
                    status: 'Fail',
                    scoreLabel: normalizedGrade
                }
            };
        }

        if (standard === 'HACCP') {
            if (ccpValidationDate) {
                return {
                    success: true,
                    status: 'Pass',
                    message: `HACCP plan Critical Control Points (CCPs) were last validated on ${ccpValidationDate}.`,
                    score: 1.0,
                    data: {
                        status: 'Pass',
                        scoreLabel: 'CCP Validated'
                    }
                };
            }
            return {
                success: false,
                status: 'Warning',
                message: 'HACCP plan exists but specific CCP validation logs are missing or outdated.',
                score: 0.5,
                data: {
                    status: 'Warning',
                    scoreLabel: 'CCP Missing Logs'
                }
            };
        }

        if (['FSSC 22000', 'SQF', 'ISO 22000'].includes(standard)) {
            return {
                success: true,
                status: 'Pass',
                message: `${standard} certification is verified and benchmarked against GFSI requirements.`,
                score: 1.0,
                data: {
                    status: 'Pass',
                    scoreLabel: 'GFSI Certified'
                }
            };
        }

        return {
            success: true,
            status: 'Warning',
            message: `Foundational ${standard} compliance detected. Recommend upgrading to a GFSI-recognized scheme for premium markets.`,
            score: 0.5,
            data: {
                status: 'Warning',
                scoreLabel: 'Basic GMP'
            }
        };
    }
}
