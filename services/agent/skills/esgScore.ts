import { Skill, SkillResult } from './skillRegistry';

export interface ESGScoreInput {
    supplierId: string;
    supplierName: string;
    scope1Emissions?: number;
    scope2Emissions?: number;
    scope3Emissions?: number;
    energyConsumption?: number;
    waterUsage?: number;
    wasteGenerated?: number;
    diversityScore?: number;
    safetyIncidents?: number;
    governanceScore?: number;
    reportingFrameworks?: string[];
}

interface ESGScores {
    environmental: number;
    social: number;
    governance: number;
    overall: number;
}

export class ESGScoreSkill implements Skill {
    id = 'esg_score';
    name = 'ESG Score Keeper';
    description = 'Aggregates Scope 1, 2, & 3 emissions and sustainability metrics into CSRD/SFDR reporting standards.';

    private csrdRequirements = {
        environmental: ['GHG_Protocol', 'CDP', 'GRI'],
        social: ['GRI_Social', 'UN_GP_graphics', 'SA8000'],
        governance: ['GRI_Governance', 'COSO', 'ISO_37000']
    };

    async execute(input: ESGScoreInput): Promise<SkillResult> {
        const { 
            supplierId, supplierName, scope1Emissions = 0, scope2Emissions = 0, scope3Emissions = 0,
            energyConsumption = 0, waterUsage = 0, wasteGenerated = 0,
            diversityScore, safetyIncidents = 0, governanceScore, reportingFrameworks = []
        } = input;

        const envScore = this.calculateEnvironmentalScore(scope1Emissions, scope2Emissions, scope3Emissions, energyConsumption, waterUsage, wasteGenerated);
        const socScore = this.calculateSocialScore(diversityScore, safetyIncidents);
        const govScore = this.calculateGovernanceScore(governanceScore);

        const overallScore = (envScore * 0.4 + socScore * 0.3 + govScore * 0.3);

        const gaps: string[] = [];
        const warnings: string[] = [];

        if (scope1Emissions === 0 && scope2Emissions === 0 && scope3Emissions === 0) {
            gaps.push('No emissions data provided - cannot calculate environmental score');
            warnings.push('Scope 1, 2, 3 emissions required for CSRD compliance');
        }

        if (!diversityScore && !governanceScore) {
            gaps.push('Social and governance metrics incomplete');
        }

        const frameworksSupported = reportingFrameworks.filter(f => 
            Object.values(this.csrdRequirements).flat().includes(f)
        );

        if (frameworksSupported.length === 0 && overallScore > 70) {
            warnings.push('High ESG score but no recognized framework certification');
        }

        const rating = overallScore >= 80 ? 'AAA' : overallScore >= 70 ? 'AA' : overallScore >= 60 ? 'A' : overallScore >= 50 ? 'BBB' : overallScore >= 40 ? 'BB' : overallScore >= 30 ? 'B' : 'CCC';

        const sfdrPrincipalAdverseImpacts = this.assessPAIs(input);

        return {
            success: gaps.length < 2,
            status: overallScore >= 60 ? 'Pass' : gaps.length > 0 ? 'Warning' : 'Fail',
            message: `ESG Score: ${overallScore.toFixed(0)}/100 (${rating}). E: ${envScore.toFixed(0)}, S: ${socScore.toFixed(0)}, G: ${govScore.toFixed(0)}`,
            score: overallScore / 100,
            data: {
                supplierId,
                supplierName,
                scores: {
                    environmental: Math.round(envScore),
                    social: Math.round(socScore),
                    governance: Math.round(govScore),
                    overall: Math.round(overallScore)
                },
                rating,
                gaps,
                warnings,
                frameworksSupported,
                csrdCompliance: this.checkCSRDCompliance(gaps, frameworksSupported),
                sfdr: {
                    principalAdverseImpacts: sfdrPrincipalAdverseImpacts,
                    sustainabilityRisk: overallScore < 50 ? 'HIGH' : overallScore < 70 ? 'MEDIUM' : 'LOW'
                },
                recommendation: this.getRecommendation(overallScore, gaps)
            }
        };
    }

    private calculateEnvironmentalScore(s1: number, s2: number, s3: number, energy: number, water: number, waste: number): number {
        let score = 50;

        if (s1 + s2 + s3 > 0) {
            const totalEmissions = s1 + s2 + s3;
            if (totalEmissions < 1000) score += 30;
            else if (totalEmissions < 10000) score += 20;
            else if (totalEmissions < 100000) score += 10;
        }

        if (energy > 0 && energy < 1000) score += 10;
        if (water > 0 && water < 5000) score += 5;
        if (waste > 0 && waste < 100) score += 5;

        return Math.min(score, 100);
    }

    private calculateSocialScore(diversity?: number, safetyIncidents?: number): number {
        let score = 50;

        if (diversity !== undefined) {
            score += Math.min(diversity, 30);
        }

        if (safetyIncidents !== undefined) {
            if (safetyIncidents === 0) score += 20;
            else if (safetyIncidents < 5) score += 10;
            else if (safetyIncidents < 10) score += 5;
        }

        return Math.min(score, 100);
    }

    private calculateGovernanceScore(score?: number): number {
        if (score === undefined) return 50;
        return Math.min(Math.max(score, 0), 100);
    }

    private checkCSRDCompliance(gaps: string[], frameworks: string[]): { compliant: boolean; requirements: string[] } {
        const requirements: string[] = [];
        
        if (!frameworks.some(f => f.includes('GRI') || f.includes('GHG'))) {
            requirements.push('GRI or GHG Protocol reporting required');
        }

        return {
            compliant: requirements.length === 0 && gaps.length < 2,
            requirements
        };
    }

    private assessPAIs(input: ESGScoreInput): string[] {
        const pais: string[] = [];

        if ((input.scope1Emissions ?? 0) > 10000) pais.push('GHG emissions (PAI 1)');
        if ((input.wasteGenerated ?? 0) > 1000) pais.push('Waste generated (PAI 5)');
        if ((input.safetyIncidents ?? 0) > 5) pais.push('Incidents of severe accidents (PAI 2)');

        return pais;
    }

    private getRecommendation(score: number, gaps: string[]): string {
        if (score >= 80) return 'Excellent ESG performance - qualifies for green financing';
        if (score >= 60) return 'Meets minimum ESG requirements - continue improvement';
        if (gaps.length > 0) return 'Address data gaps and improve transparency for CSRD';
        return 'Below threshold - implement ESG improvement plan';
    }
}
