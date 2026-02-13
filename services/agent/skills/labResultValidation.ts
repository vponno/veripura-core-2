import { Skill, SkillResult } from './skillRegistry';

export interface LabResultValidationInput {
    certificateOfAnalysis: {
        testParameters: Array<{
            name: string;
            value: number;
            unit: string;
            method?: string;
        }>;
        sampleId: string;
        testDate: string;
        labName: string;
    };
    productSpec: {
        parameters: Array<{
            name: string;
            minValue?: number;
            maxValue?: number;
            targetValue?: number;
            tolerance?: number;
        }>;
        productName: string;
        grade?: string;
    };
}

interface ValidationResult {
    parameter: string;
    status: 'pass' | 'fail' | 'warning';
    declaredValue: number;
    specRange: string;
    deviation?: number;
}

export class LabResultValidationSkill implements Skill {
    id = 'lab_result_validation';
    name = 'Lab Result Validator';
    description = 'Verifies Certificate of Analysis (COA) values against product specifications and tolerance thresholds.';

    async execute(input: LabResultValidationInput): Promise<SkillResult> {
        const { certificateOfAnalysis, productSpec } = input;
        
        const results: ValidationResult[] = [];
        let passCount = 0;
        let failCount = 0;
        let warningCount = 0;

        certificateOfAnalysis.testParameters.forEach(param => {
            const spec = productSpec.parameters.find(s => 
                s.name.toLowerCase() === param.name.toLowerCase()
            );

            if (!spec) {
                results.push({
                    parameter: param.name,
                    status: 'warning',
                    declaredValue: param.value,
                    specRange: 'Not specified',
                    deviation: 0
                });
                warningCount++;
                return;
            }

            const { minValue, maxValue, targetValue, tolerance } = spec;
            let status: 'pass' | 'fail' | 'warning' = 'pass';
            let deviation = 0;

            if (minValue !== undefined && param.value < minValue) {
                status = 'fail';
                deviation = ((minValue - param.value) / minValue) * 100;
            } else if (maxValue !== undefined && param.value > maxValue) {
                status = 'fail';
                deviation = ((param.value - maxValue) / maxValue) * 100;
            } else if (targetValue !== undefined && tolerance !== undefined) {
                deviation = Math.abs((param.value - targetValue) / targetValue) * 100;
                if (deviation > tolerance) {
                    status = deviation > tolerance * 2 ? 'fail' : 'warning';
                }
            }

            if (status === 'pass') passCount++;
            else if (status === 'fail') failCount++;
            else warningCount++;

            results.push({
                parameter: param.name,
                status,
                declaredValue: param.value,
                specRange: minValue !== undefined && maxValue !== undefined 
                    ? `${minValue} - ${maxValue}` 
                    : minValue !== undefined 
                        ? `>= ${minValue}` 
                        : maxValue !== undefined 
                            ? `<= ${maxValue}` 
                            : 'N/A',
                deviation: deviation || undefined
            });
        });

        const overallStatus = failCount > 0 ? 'Fail' : warningCount > 0 ? 'Warning' : 'Pass';
        const score = passCount / (passCount + failCount + warningCount);

        return {
            success: failCount === 0,
            status: overallStatus,
            message: `COA Validation: ${passCount} passed, ${warningCount} warnings, ${failCount} failures`,
            score,
            data: {
                certificateId: certificateOfAnalysis.sampleId,
                labName: certificateOfAnalysis.labName,
                testDate: certificateOfAnalysis.testDate,
                productName: productSpec.productName,
                results,
                summary: {
                    passCount,
                    failCount,
                    warningCount,
                    totalTests: results.length
                },
                recommendation: this.getRecommendation(failCount, warningCount, results)
            }
        };
    }

    private getRecommendation(failCount: number, warningCount: number, results: ValidationResult[]): string {
        if (failCount > 0) {
            const failedParams = results.filter(r => r.status === 'fail').map(r => r.parameter);
            return `CRITICAL: Reject shipment. Failed parameters: ${failedParams.join(', ')}`;
        }
        if (warningCount > 0) {
            const warningParams = results.filter(r => r.status === 'warning').map(r => r.parameter);
            return `WARNING: Review required for: ${warningParams.join(', ')}`;
        }
        return 'APPROVED: All parameters within specification';
    }
}
