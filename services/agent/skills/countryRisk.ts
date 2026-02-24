import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export interface CountryRiskInput {
    country: string;
    transactionValue?: number;
    duration?: number;
    context?: 'trade' | 'investment' | 'supply_chain';
}

interface CountryRiskProfile {
    countryCode: string;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    dimensions: {
        political: { score: number; risk: string };
        economic: { score: number; risk: string };
        operational: { score: number; risk: string };
        security: { score: number; risk: string };
    };
    alerts: string[];
    lastUpdated: string;
}

export class CountryRiskSkill implements Skill {
    id = 'country_risk';
    name = 'Country Risk Monitor';
    description = 'Monitors political instability, expropriation risk, and sovereign default indicators using geopolitical feeds.';
    public category = SkillCategory.TRADE;

    private riskDatabase: Map<string, CountryRiskProfile> = new Map([
        ['US', { countryCode: 'US', overallRisk: 'low', score: 92, dimensions: { political: { score: 90, risk: 'Stable' }, economic: { score: 95, risk: 'Strong' }, operational: { score: 90, risk: 'Low' }, security: { score: 93, risk: 'Low' } }, alerts: [], lastUpdated: '2024-03-01' }],
        ['DE', { countryCode: 'DE', overallRisk: 'low', score: 90, dimensions: { political: { score: 92, risk: 'Stable' }, economic: { score: 88, risk: 'Strong' }, operational: { score: 90, risk: 'Low' }, security: { score: 90, risk: 'Low' } }, alerts: [], lastUpdated: '2024-03-01' }],
        ['CN', { countryCode: 'CN', overallRisk: 'medium', score: 65, dimensions: { political: { score: 60, risk: 'Moderate' }, economic: { score: 70, risk: 'Moderate' }, operational: { score: 65, risk: 'Moderate' }, security: { score: 65, risk: 'Moderate' } }, alerts: ['Trade tensions', 'Regulatory uncertainty'], lastUpdated: '2024-03-01' }],
        ['RU', { countryCode: 'RU', overallRisk: 'critical', score: 25, dimensions: { political: { score: 20, risk: 'Critical' }, economic: { score: 30, risk: 'High' }, operational: { score: 25, risk: 'Critical' }, security: { score: 25, risk: 'Critical' } }, alerts: ['Sanctions', 'War/Conflict', 'Currency controls'], lastUpdated: '2024-03-01' }],
        ['VE', { countryCode: 'VE', overallRisk: 'critical', score: 15, dimensions: { political: { score: 15, risk: 'Critical' }, economic: { score: 10, risk: 'Critical' }, operational: { score: 20, risk: 'Critical' }, security: { score: 15, risk: 'Critical' } }, alerts: ['Hyperinflation', 'Political instability', 'Currency controls'], lastUpdated: '2024-03-01' }],
        ['PK', { countryCode: 'PK', overallRisk: 'high', score: 35, dimensions: { political: { score: 30, risk: 'High' }, economic: { score: 40, risk: 'High' }, operational: { score: 35, risk: 'High' }, security: { score: 35, risk: 'High' } }, alerts: ['Political uncertainty', 'Security concerns'], lastUpdated: '2024-03-01' }],
    ]);

    async execute(input: CountryRiskInput): Promise<SkillResult> {
        const { country, transactionValue = 0, duration = 0, context = 'trade' } = input;

        let profile = this.riskDatabase.get(country);

        if (!profile) {
            profile = this.generateUnknownProfile(country);
        }

        const riskFactors: string[] = [];
        let severity: 'info' | 'warning' | 'critical' = 'info';
        
        if (profile.overallRisk === 'critical') {
            riskFactors.push('Critical risk - avoid or extreme caution');
            severity = 'critical';
        } else if (profile.overallRisk === 'high') {
            riskFactors.push('High risk - enhanced due diligence required');
            severity = 'warning';
        }

        profile.alerts.forEach(alert => {
            riskFactors.push(alert);
        });

        if (transactionValue > 500000 && profile.overallRisk !== 'low') {
            riskFactors.push(`High-value transaction ($${transactionValue.toLocaleString()}) with ${profile.overallRisk} risk country`);
            if (severity !== 'critical') severity = 'warning';
        }

        if (context === 'supply_chain' && profile.dimensions.operational.risk === 'Critical') {
            riskFactors.push('Supply chain operations at critical risk due to operational environment');
            severity = 'critical';
        }

        const mitigation = this.getMitigationRecommendations(profile, context);

        return {
            success: profile.overallRisk !== 'critical',
            status: profile.overallRisk === 'low' ? 'Pass' : profile.overallRisk === 'critical' ? 'Fail' : 'Warning',
            message: `Country Risk: ${profile.overallRisk.toUpperCase()} (${profile.score}/100). ${riskFactors.join('. ')}`,
            score: profile.score / 100,
            data: {
                countryCode: country,
                riskProfile: profile,
                riskFactors,
                severity,
                transactionValue,
                context,
                mitigation,
                recommendation: this.getRecommendation(profile, severity)
            }
        };
    }

    private generateUnknownProfile(country: string): CountryRiskProfile {
        return {
            countryCode: country,
            overallRisk: 'medium',
            score: 55,
            dimensions: {
                political: { score: 55, risk: 'Unknown' },
                economic: { score: 55, risk: 'Unknown' },
                operational: { score: 55, risk: 'Unknown' },
                security: { score: 55, risk: 'Unknown' }
            },
            alerts: ['Limited data available for this country'],
            lastUpdated: new Date().toISOString().split('T')[0]
        };
    }

    private getMitigationRecommendations(profile: CountryRiskProfile, context: string): string[] {
        const recommendations: string[] = [];

        if (profile.dimensions.political.risk !== 'Stable') {
            recommendations.push('Monitor political developments regularly');
        }
        if (profile.dimensions.economic.risk === 'High' || profile.dimensions.economic.risk === 'Critical') {
            recommendations.push('Use hard currency for transactions');
            recommendations.push('Consider currency hedging');
        }
        if (profile.dimensions.security.risk === 'High' || profile.dimensions.security.risk === 'Critical') {
            recommendations.push('Engage local security consultants');
            recommendations.push('Review insurance coverage for political risk');
        }
        if (context === 'investment') {
            recommendations.push('Consider investment insurance (MIGA, OPIC)');
        }

        return recommendations;
    }

    private getRecommendation(profile: CountryRiskProfile, severity: string): string {
        if (profile.overallRisk === 'low') return 'Standard procedures apply';
        if (profile.overallRisk === 'critical') return 'Avoid transaction or implement maximum mitigation measures';
        return 'Enhanced due diligence and risk mitigation required';
    }
}
