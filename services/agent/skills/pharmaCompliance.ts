import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export interface PharmaComplianceInput {
    productName: string;
    productType: 'pharmaceutical' | 'medical_device' | 'api' | 'excipient';
    storageTemp: 'ambient' | 'cold' | 'frozen' | 'cryogenic';
    manufacturer: {
        name: string;
        country: string;
        gmpCertificate?: string;
    };
    transport: {
        mode: string;
        temperatureLog?: number[];
        duration: number;
    };
    documents?: {
        hasGDP?: boolean;
        hasCoA?: boolean;
        hasMarketingAuth?: boolean;
    };
}

interface Regulation {
    region: string;
    requirement: string;
    mandatory: boolean;
}

export class PharmaComplianceSkill implements Skill {
    id = 'pharma_compliance';
    name = 'Pharma Compliance Guard';
    description = 'Verifies Good Distribution Practice (GDP) and Good Manufacturing Practice (GMP) for pharmaceuticals and medical devices.';
    public category = SkillCategory.HIGHRISK;

    private regulations: Record<string, Regulation[]> = {
        EU: [
            { region: 'EU', requirement: 'GDP (Good Distribution Practice)', mandatory: true },
            { region: 'EU', requirement: 'Marketing Authorization', mandatory: true },
            { region: 'EU', requirement: 'Temperature monitoring (GDP)', mandatory: true }
        ],
        USA: [
            { region: 'USA', requirement: 'FDA 21 CFR Part 210/211', mandatory: true },
            { region: 'USA', requirement: 'State pharmacy license', mandatory: true }
        ],
    };

    async execute(input: PharmaComplianceInput): Promise<SkillResult> {
        const { productName, productType, storageTemp, manufacturer, transport, documents = {} } = input;

        const issues: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];
        let severity: 'info' | 'warning' | 'critical' = 'info';
        let status = 'Pass';

        const { hasGDP, hasCoA, hasMarketingAuth } = documents;

        if (!hasGDP) {
            issues.push('Missing GDP (Good Distribution Practice) certificate');
            severity = 'critical';
            status = 'Fail';
        }

        if (!hasCoA) {
            warnings.push('Missing Certificate of Analysis');
            if (severity !== 'critical') severity = 'warning';
            if (status !== 'Fail') status = 'Warning';
        }

        if (!hasMarketingAuth && productType === 'pharmaceutical') {
            issues.push('Missing Marketing Authorization / NDA');
            severity = 'critical';
            status = 'Fail';
        }

        if (storageTemp === 'cold' || storageTemp === 'frozen') {
            if (!transport.temperatureLog || transport.temperatureLog.length === 0) {
                issues.push('Cold chain product without temperature log');
                severity = 'critical';
                status = 'Fail';
            } else {
                const excursions = this.checkTemperatureExcursions(transport.temperatureLog, storageTemp);
                if (excursions > 0) {
                    issues.push(`TEMPERATURE EXCURSION: ${excursions} instances outside range`);
                    severity = 'critical';
                    status = 'Fail';
                }
            }
        }

        if (!manufacturer.gmpCertificate) {
            warnings.push('No GMP certificate on file for manufacturer');
            if (severity !== 'critical') severity = 'warning';
        }

        if (transport.duration > 72 && storageTemp === 'cold') {
            warnings.push('Extended transit time for cold-chain product - verify temperature maintenance');
        }

        const applicableRegs = this.getApplicableRegulations(manufacturer.country);

        return {
            success: status !== 'Fail',
            status,
            message: severity === 'critical' 
                ? `PHARMA COMPLIANCE FAILED: ${issues.join('. ')}`
                : warnings.length > 0 
                    ? `COMPLIANCE WARNINGS: ${warnings.join('. ')}`
                    : `Compliant: GDP/GMP requirements met for ${productName}`,
            score: severity === 'critical' ? 0 : severity === 'warning' ? 0.7 : 1.0,
            data: {
                productName,
                productType,
                storageTemp,
                manufacturer: {
                    name: manufacturer.name,
                    country: manufacturer.country,
                    gmpStatus: manufacturer.gmpCertificate ? 'Verified' : 'Not verified'
                },
                transport: {
                    mode: transport.mode,
                    durationHours: transport.duration,
                    temperatureLogProvided: !!transport.temperatureLog,
                    temperatureExcursions: transport.temperatureLog ? this.checkTemperatureExcursions(transport.temperatureLog, storageTemp) : 0
                },
                documents: {
                    gdp: hasGDP || false,
                    coa: hasCoA || false,
                    marketingAuth: hasMarketingAuth || false
                },
                applicableRegulations: applicableRegs,
                issues,
                warnings,
                recommendation: this.getRecommendation(severity, issues, warnings)
            }
        };
    }

    private checkTemperatureExcursions(log: number[], storageTemp: string): number {
        const thresholds = {
            cold: { min: 2, max: 8 },
            frozen: { min: -25, max: -15 },
            cryogenic: { min: -196, max: -150 }
        };

        const range = thresholds[storageTemp as keyof typeof thresholds];
        if (!range) return 0;

        return log.filter(t => t < range.min || t > range.max).length;
    }

    private getApplicableRegulations(country: string): string[] {
        const region = country === 'USA' ? 'USA' : 'EU';
        return this.regulations[region]?.map(r => r.requirement) || ['GDP/GMP'];
    }

    private getRecommendation(severity: string, issues: string[], warnings: string[]): string {
        if (severity === 'critical') {
            return 'QUARANTINE: Do not distribute. Resolve critical compliance issues.';
        }
        if (warnings.length > 0) {
            return 'REVIEW: Address warnings before full distribution authorization.';
        }
        return 'APPROVED: Meet GDP/GMP requirements for distribution.';
    }
}
