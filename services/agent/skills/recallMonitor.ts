import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export interface RecallMonitorInput {
    product: {
        name: string;
        brand?: string;
        sku?: string;
        upc?: string;
        batchNumber?: string;
        manufacturingDate?: string;
    };
    shipment: {
        origin: string;
        destination: string;
        departureDate?: string;
        arrivalDate?: string;
    };
}

interface RecallAlert {
    recallId: string;
    source: 'FDA' | 'RASFF' | 'EC' | 'EFSA';
    date: string;
    product: string;
    brand?: string;
    reason: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'Active' | 'Completed';
    recalledCountries: string[];
    productCode?: string;
}

export class RecallMonitorSkill implements Skill {
    id = 'recall_monitor';
    name = 'Recall Monitor';
    description = 'Cross-checks active shipments against RASFF (EU) and FDA recall alerts to prevent distribution of recalled products.';
    public category = SkillCategory.QUALITY;

    private activeRecalls: RecallAlert[] = [
        {
            recallId: 'FDA-2024-001',
            source: 'FDA',
            date: '2024-01-15',
            product: 'Peanut Butter',
            brand: 'BrandA',
            reason: 'Salmonella contamination',
            severity: 'critical',
            status: 'Active',
            recalledCountries: ['USA', 'Canada'],
            productCode: 'PB-001'
        },
        {
            recallId: 'RASFF-2024-089',
            source: 'RASFF',
            date: '2024-02-20',
            product: 'Frozen Berries',
            brand: 'BrandB',
            reason: 'Hepatitis A contamination',
            severity: 'critical',
            status: 'Active',
            recalledCountries: ['Germany', 'France', 'Netherlands', 'Belgium'],
            productCode: 'FB-2024'
        },
        {
            recallId: 'FDA-2024-045',
            source: 'FDA',
            date: '2024-03-01',
            product: 'Spinach',
            brand: 'BrandC',
            reason: 'Listeria monocytogenes',
            severity: 'high',
            status: 'Active',
            recalledCountries: ['USA'],
            productCode: 'SPN-045'
        },
    ];

    async execute(input: RecallMonitorInput): Promise<SkillResult> {
        const { product, shipment } = input;
        
        const matches: RecallAlert[] = [];
        const info: string[] = [];
        let severity: 'info' | 'warning' | 'critical' = 'info';
        let status = 'Pass';

        this.activeRecalls.forEach(recall => {
            const productMatch = this.checkProductMatch(product, recall);
            const countryMatch = this.checkCountryMatch(shipment.destination, recall);

            if (productMatch && countryMatch) {
                matches.push(recall);
            } else if (productMatch && !countryMatch) {
                info.push(`Recall exists for ${recall.product} but not in destination country`);
            }
        });

        if (matches.length > 0) {
            const criticalMatches = matches.filter(m => m.severity === 'critical');
            if (criticalMatches.length > 0) {
                severity = 'critical';
                status = 'Fail';
            } else {
                severity = 'warning';
                status = 'Warning';
            }
        }

        return {
            success: status !== 'Fail',
            status,
            message: matches.length > 0 
                ? `⚠️ RECALL ALERT: ${matches.length} active recall(s) match this shipment`
                : `No active recalls match shipment to ${shipment.destination}`,
            score: matches.length > 0 ? 0 : 1.0,
            data: {
                product: product.name,
                shipment: {
                    origin: shipment.origin,
                    destination: shipment.destination
                },
                matches,
                matchCount: matches.length,
                criticalAlerts: matches.filter(m => m.severity === 'critical').length,
                info,
                recommendation: this.getRecommendation(matches, severity)
            }
        };
    }

    private checkProductMatch(product: RecallMonitorInput['product'], recall: RecallAlert): boolean {
        if (product.name.toLowerCase().includes(recall.product.toLowerCase()) || 
            recall.product.toLowerCase().includes(product.name.toLowerCase())) {
            return true;
        }

        if (product.brand && recall.brand) {
            return product.brand.toLowerCase() === recall.brand.toLowerCase();
        }

        if (product.sku && recall.productCode) {
            return product.sku === recall.productCode;
        }

        return false;
    }

    private checkCountryMatch(destination: string, recall: RecallAlert): boolean {
        const destNormalized = destination.toLowerCase();
        
        return recall.recalledCountries.some(c => 
            c.toLowerCase() === destNormalized || 
            c.toLowerCase().includes(destNormalized) ||
            destNormalized.includes(c.toLowerCase())
        );
    }

    private getRecommendation(matches: RecallAlert[], severity: string): string {
        if (matches.length === 0) {
            return 'Proceed with shipment - no active recalls';
        }

        const critical = matches.filter(m => m.severity === 'critical');
        if (critical.length > 0) {
            return `STOP SHIPMENT: ${critical.length} critical recall(s) active. Quarantine product immediately. Contact ${critical[0].source} for return instructions.`;
        }

        return `HOLD: ${matches.length} recall(s) match. Verify batch numbers and contact destination country authorities.`;
    }
}
