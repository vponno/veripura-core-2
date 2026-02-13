import { Skill, SkillResult } from './skillRegistry';

export interface CreditRiskInput {
    supplierId: string;
    supplierName: string;
    country: string;
    transactionValue?: number;
}

interface CreditProfile {
    supplierId: string;
    score: number;
    rating: 'A' | 'B' | 'C' | 'D';
    bankruptcyRisk: 'low' | 'medium' | 'high';
    lastUpdated: string;
    financialHighlights: {
        revenue?: number;
        employees?: number;
        yearsInBusiness?: number;
    };
}

export class CreditRiskSkill implements Skill {
    id = 'credit_risk';
    name = 'Credit Risk Analyzer';
    description = 'Evaluates supplier financial health and bankruptcy risk using credit bureau data (Dun & Bradstreet / Coface).';

    private mockCreditDatabase: Map<string, CreditProfile> = new Map([
        ['SUP001', { supplierId: 'SUP001', score: 75, rating: 'A', bankruptcyRisk: 'low', lastUpdated: '2024-01-15', financialHighlights: { revenue: 50000000, employees: 250, yearsInBusiness: 15 } }],
        ['SUP002', { supplierId: 'SUP002', score: 45, rating: 'C', bankruptcyRisk: 'medium', lastUpdated: '2024-02-20', financialHighlights: { revenue: 8000000, employees: 45, yearsInBusiness: 5 } }],
        ['SUP003', { supplierId: 'SUP003', score: 25, rating: 'D', bankruptcyRisk: 'high', lastUpdated: '2024-03-10', financialHighlights: { revenue: 1200000, employees: 12, yearsInBusiness: 2 } }],
    ]);

    async execute(input: CreditRiskInput): Promise<SkillResult> {
        const { supplierId, supplierName, country, transactionValue = 0 } = input;

        let profile = this.mockCreditDatabase.get(supplierId);

        if (!profile) {
            profile = this.assessUnknownSupplier(country);
        }

        const riskFactors: string[] = [];
        let severity: 'info' | 'warning' | 'critical' = 'info';

        if (profile.bankruptcyRisk === 'high') {
            riskFactors.push('High bankruptcy risk detected');
            severity = 'critical';
        } else if (profile.bankruptcyRisk === 'medium') {
            riskFactors.push('Moderate financial stress indicators');
            severity = 'warning';
        }

        if (transactionValue > 100000 && profile.rating === 'C') {
            riskFactors.push('High-value transaction with moderate credit rating');
            severity = 'critical';
        }

        if (profile.rating === 'D') {
            riskFactors.push('Poor credit rating - consider prepayment or guarantee');
            severity = 'critical';
        }

        const recommendation = this.getRecommendation(profile, transactionValue);

        return {
            success: true,
            status: profile.rating === 'A' || profile.rating === 'B' ? 'Pass' : 'Warning',
            message: `Credit Risk Assessment: Rating ${profile.rating} (${profile.score}/100). ${riskFactors.join('. ')}`,
            score: profile.score / 100,
            data: {
                supplierId,
                supplierName,
                creditProfile: profile,
                riskFactors,
                recommendation,
                severity,
                transactionValue
            }
        };
    }

    private assessUnknownSupplier(country: string): CreditProfile {
        const highRiskCountries = ['KP', 'IR', 'SY', 'CU', 'VE'];
        const mediumRiskCountries = ['PK', 'BD', 'VN', 'KH'];

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (highRiskCountries.includes(country)) riskLevel = 'high';
        else if (mediumRiskCountries.includes(country)) riskLevel = 'medium';

        return {
            supplierId: 'UNKNOWN',
            score: riskLevel === 'high' ? 30 : riskLevel === 'medium' ? 50 : 70,
            rating: riskLevel === 'high' ? 'D' : riskLevel === 'medium' ? 'C' : 'B',
            bankruptcyRisk: riskLevel,
            lastUpdated: new Date().toISOString().split('T')[0],
            financialHighlights: {}
        };
    }

    private getRecommendation(profile: CreditProfile, transactionValue: number): string {
        if (profile.rating === 'A') return 'Standard payment terms approved';
        if (profile.rating === 'B') return 'Standard payment terms with monitoring';
        if (profile.rating === 'C') return 'Consider advance payment or letter of credit';
        return 'Prepayment required or credit insurance recommended';
    }
}
