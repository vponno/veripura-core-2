import { Skill, SkillResult } from './skillRegistry';

export interface ForcedLaborInput {
    supplierId: string;
    supplierName: string;
    facilityLocations: Array<{ address: string; country: string; coordinates?: { lat: number; lng: number } }>;
    rawMaterials?: string[];
    workforceSize?: number;
}

interface EntityMatch {
    name: string;
    entityType: 'producer' | 'facility' | 'transporter';
    riskLevel: 'high' | 'medium' | 'low';
    source: string;
    listingDate: string;
    reason: string;
}

export class ForcedLaborSkill implements Skill {
    id = 'forced_labor';
    name = 'Forced Labor Detector';
    description = 'Screens sub-tier suppliers for links to state-sponsored forced labor programs (UFLPA, Sheffield Hallam).';

    private highRiskRegions = ['XU', 'XJ', 'HI'];
    private highRiskProducts = ['cotton', 'tomatoes', 'solar panels', 'polysilicon', 'aluminum', 'copper'];

    private mockEntityList: EntityMatch[] = [
        { name: 'Xinjiang Production and Construction Corps', entityType: 'producer', riskLevel: 'high', source: 'UFLPA Entity List', listingDate: '2022-06-21', reason: 'State-sponsored forced labor program' },
        { name: 'Hetian Haolin Hair Products Co.', entityType: 'producer', riskLevel: 'high', source: 'UFLPA Entity List', listingDate: '2022-06-21', reason: 'Forced labor in manufacturing' },
        { name: 'Ningxia Jiaxin Textiles', entityType: 'producer', riskLevel: 'medium', source: 'Sheffield Hallam', listingDate: '2021-03-15', reason: 'Indicators of forced labor' },
    ];

    async execute(input: ForcedLaborInput): Promise<SkillResult> {
        const { supplierId, supplierName, facilityLocations = [], rawMaterials = [], workforceSize = 0 } = input;

        const matches: EntityMatch[] = [];
        const riskIndicators: string[] = [];
        let severity: 'info' | 'warning' | 'critical' = 'info';
        let status = 'Pass';

        const locationCountries = facilityLocations.map(l => l.country);
        
        if (locationCountries.some(c => this.highRiskRegions.includes(c))) {
            riskIndicators.push('Facility located in high-risk region for forced labor');
            severity = 'critical';
            status = 'Fail';
        }

        if (rawMaterials.some(m => this.highRiskProducts.includes(m.toLowerCase())) && locationCountries.some(c => this.highRiskRegions.includes(c))) {
            riskIndicators.push('High-risk product from high-risk region');
            severity = 'critical';
            status = 'Fail';
        }

        const supplierMatch = this.mockEntityList.filter(e => 
            e.name.toLowerCase().includes(supplierName.toLowerCase())
        );
        
        if (supplierMatch.length > 0) {
            matches.push(...supplierMatch);
            severity = 'critical';
            status = 'Fail';
        }

        facilityLocations.forEach(loc => {
            const regionMatch = this.mockEntityList.filter(e => 
                e.riskLevel === 'high' && loc.country && this.highRiskRegions.includes(loc.country)
            );
            if (regionMatch.length > 0) {
                matches.push(...regionMatch);
            }
        });

        if (workforceSize > 10000 && locationCountries.some(c => this.highRiskRegions.includes(c))) {
            riskIndicators.push('Large workforce in high-risk region - verify labor practices');
            if (severity !== 'critical') severity = 'warning';
            if (status !== 'Fail') status = 'Warning';
        }

        const dueDiligenceActions = this.getDueDiligenceActions(matches, riskIndicators);

        return {
            success: status !== 'Fail',
            status,
            message: severity === 'critical' 
                ? `FORCED LABOR RISK DETECTED: ${matches.length} entity match(es) found`
                : riskIndicators.length > 0 
                    ? `Risk indicators identified: ${riskIndicators.join('. ')}`
                    : 'No forced labor indicators detected',
            score: matches.length > 0 ? 0 : severity === 'warning' ? 0.7 : 1.0,
            data: {
                supplierId,
                supplierName,
                matches,
                riskIndicators,
                severity,
                dueDiligenceActions,
                uflaEntityListStatus: matches.length > 0 ? 'MATCH_FOUND' : 'CLEARED',
                recommendation: this.getRecommendation(matches, riskIndicators)
            }
        };
    }

    private getDueDiligenceActions(matches: EntityMatch[], indicators: string[]): string[] {
        const actions: string[] = [];

        if (matches.length > 0) {
            actions.push('STOP: Do not source from listed entities');
            actions.push('Conduct enhanced due diligence (EDD)');
            actions.push('Request independent verification of labor practices');
            actions.push('Document all supply chain contacts');
        }

        if (indicators.some(i => i.includes('high-risk region'))) {
            actions.push('Implement traceability measures to sub-tier suppliers');
            actions.push('Request third-party audit (BSCI, SA8000)');
        }

        if (actions.length === 0) {
            actions.push('Maintain standard documentation');
            actions.push('Continue routine monitoring');
        }

        return actions;
    }

    private getRecommendation(matches: EntityMatch[], indicators: string[]): string {
        if (matches.length > 0) return 'Do not proceed - entity matches UFLPA/Sheffield Hallam lists';
        if (indicators.some(i => i.includes('high-risk'))) return 'Proceed with enhanced due diligence and verification';
        return 'Standard due diligence sufficient';
    }
}
