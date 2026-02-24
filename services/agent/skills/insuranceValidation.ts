import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export interface InsuranceValidationInput {
    policyNumber?: string;
    cargoValue: number;
    currency?: string;
    commodity: string;
    origin: string;
    destination: string;
    transportMode: 'sea' | 'air' | 'road' | 'rail';
}

interface PolicyCoverage {
    policyNumber: string;
    maxCoverage: number;
    coveredRisks: string[];
    excludedRisks: string[];
    deductible: number;
    status: 'active' | 'expired' | 'suspended';
}

export class InsuranceValidationSkill implements Skill {
    id = 'insurance_validation';
    name = 'Insurance Validator';
    description = 'Validates cargo insurance adequacy against policy limits and checks for specific commodity exclusions.';
    public category = SkillCategory.FINANCIAL;

    private mockPolicies: PolicyCoverage[] = [
        { policyNumber: 'POL-001', maxCoverage: 500000, coveredRisks: ['fire', 'theft', 'collision', 'natural_disaster'], excludedRisks: ['war', 'nuclear', 'delay'], deductible: 5000, status: 'active' },
        { policyNumber: 'POL-002', maxCoverage: 100000, coveredRisks: ['fire', 'theft'], excludedRisks: ['war', 'nuclear', 'collision', 'natural_disaster'], deductible: 2500, status: 'active' },
        { policyNumber: 'POL-003', maxCoverage: 200000, coveredRisks: ['fire', 'theft', 'collision'], excludedRisks: ['war', 'nuclear', 'delay', 'biological'], deductible: 10000, status: 'expired' },
    ];

    private highValueCommodities = ['electronics', 'pharmaceuticals', 'jewelry', 'semiconductors'];
    private excludedCommodities = ['weapons', 'ammunition', 'nuclear materials', 'live animals'];

    async execute(input: InsuranceValidationInput): Promise<SkillResult> {
        const { policyNumber, cargoValue, currency = 'USD', commodity, origin, destination, transportMode } = input;

        const issues: string[] = [];
        const warnings: string[] = [];
        let severity: 'info' | 'warning' | 'critical' = 'info';
        let status = 'Pass';

        if (this.excludedCommodities.some(c => commodity.toLowerCase().includes(c))) {
            return {
                success: false,
                status: 'Fail',
                message: `Commodity '${commodity}' is excluded from standard cargo insurance coverage.`,
                score: 0,
                data: { excluded: true, commodity, recommendation: 'Specialist coverage required' }
            };
        }

        let policy: PolicyCoverage | undefined;
        
        if (policyNumber) {
            policy = this.mockPolicies.find(p => p.policyNumber === policyNumber);
            
            if (!policy) {
                issues.push(`Policy ${policyNumber} not found in database`);
                severity = 'critical';
                status = 'Fail';
            } else if (policy.status !== 'active') {
                issues.push(`Policy ${policyNumber} is ${policy.status}`);
                severity = 'critical';
                status = 'Fail';
            } else if (policy.maxCoverage < cargoValue) {
                issues.push(`Coverage insufficient: Policy limit $${policy.maxCoverage.toLocaleString()} < Cargo value $${cargoValue.toLocaleString()}`);
                severity = 'critical';
                status = 'Fail';
            }
        }

        if (!policyNumber) {
            warnings.push('No policy provided - cannot verify coverage');
            severity = 'warning';
            status = 'Warning';
        }

        if (cargoValue > 250000 && transportMode === 'sea') {
            warnings.push('High-value sea shipment - verify war risk coverage');
        }

        if (this.highValueCommodities.some(c => commodity.toLowerCase().includes(c)) && cargoValue > 100000) {
            warnings.push('High-value commodity requires specialized coverage');
        }

        const coverageGaps = policy 
            ? policy.excludedRisks.filter(r => !policy!.coveredRisks.includes(r))
            : [];

        if (coverageGaps.length > 0) {
            warnings.push(`Coverage gaps identified: ${coverageGaps.join(', ')}`);
        }

        const estimatedPremium = this.estimatePremium(cargoValue, transportMode, origin, destination);

        return {
            success: status !== 'Fail',
            status,
            message: severity === 'critical' 
                ? `Insurance Validation Failed: ${issues.join('. ')}`
                : `Insurance Validation: ${warnings.length > 0 ? warnings.join('. ') : 'Coverage adequate'}`,
            score: severity === 'critical' ? 0 : severity === 'warning' ? 0.7 : 1.0,
            data: {
                policyNumber: policy?.policyNumber || 'Not provided',
                cargoValue,
                currency,
                coverageStatus: status,
                issues,
                warnings,
                coverageGaps,
                estimatedPremium,
                recommendation: this.getRecommendation(severity, issues, warnings)
            }
        };
    }

    private estimatePremium(value: number, mode: string, origin: string, destination: string): number {
        const baseRates: Record<string, number> = { sea: 0.003, air: 0.008, road: 0.005, rail: 0.004 };
        const rate = baseRates[mode] || 0.005;
        
        const routeMultiplier = (origin === 'CN' || destination === 'CN') && (origin === 'US' || destination === 'US') ? 1.3 : 1.0;
        
        return Math.round(value * rate * routeMultiplier * 100) / 100;
    }

    private getRecommendation(severity: string, issues: string[], warnings: string[]): string {
        if (severity === 'critical') {
            return issues.some(i => i.includes('Coverage insufficient')) 
                ? 'Increase policy coverage or split shipment across multiple policies'
                : 'Provide valid active policy before shipment';
        }
        if (severity === 'warning') {
            return warnings.some(w => w.includes('war risk')) 
                ? 'Consider adding war risk coverage for high-value shipments'
                : 'Review coverage gaps with insurance provider';
        }
        return 'Current insurance coverage is adequate for this shipment';
    }
}
