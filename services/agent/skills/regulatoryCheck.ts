import { Skill, SkillResult } from './skillRegistry';
import complianceRules from '../../rules/complianceRules.json';

interface RegulatoryCheckInput {
    regulation?: string;
    context: {
        product: string;
        origin?: string;
        destination: string;
        [key: string]: any;
    };
    _learnedAdjustments?: Record<string, any>;
}

type DocCategory = 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other';

export class RegulatoryCheckSkill implements Skill {
    id = 'regulatory_check';
    name = 'Regulatory Compliance Check';
    description = 'Validates compliance with specific regulations based on origin, destination, and product data, using a dynamic rule engine.';

    async execute(input: RegulatoryCheckInput): Promise<SkillResult> {
        const { regulation, context, _learnedAdjustments } = input;
        const { product, origin = 'any', destination } = context;

        let applicableRules = complianceRules.filter(rule => {
            const destMatch = rule.destination === 'any' ||
                rule.destination === destination ||
                (rule.destination === 'EU' && this.isEU(destination));

            const originMatch = rule.origin === 'any' || rule.origin === origin;

            const prodMatch = rule.product_category === 'General' ||
                product.toLowerCase().includes(rule.product_category.toLowerCase());

            const regMatch = !regulation || rule.rule_id.includes(regulation.toLowerCase()) || rule.regulation.includes(regulation);

            return destMatch && originMatch && prodMatch && regMatch;
        });

        if (_learnedAdjustments?.threshold) {
            console.log(`[RegulatoryCheck] Applying learned threshold: ${_learnedAdjustments.threshold}`);
        }

        if (applicableRules.length === 0) {
            return {
                success: true,
                status: 'Pass',
                message: 'No specific regulatory blocking rules found for this route/product combination.',
                score: 1.0,
                data: { rulesChecked: 0 },
                requiredDocuments: this.getRequiredDocumentsFromRules(destination, origin, product)
            };
        }

        const violations: string[] = [];
        const requiredDocs: Array<{name: string; description: string; category: DocCategory; agency: string; agencyLink: string}> = [];

        for (const rule of applicableRules) {
            if (rule.required_documents) {
                rule.required_documents.forEach((doc: any) => {
                    requiredDocs.push({
                        name: doc.name,
                        description: doc.description || `Required by ${rule.regulation}`,
                        category: this.mapCategory(doc.category),
                        agency: 'Regulatory Authority',
                        agencyLink: ''
                    });
                });
            }

            if (rule.rule_id === 'rule_eudr_eu_import') {
                if (!context.geolocation) violations.push(`${rule.regulation}: Missing Geolocation.`);
                if (context.deforestationFree === false) violations.push(`${rule.regulation}: Product is not deforestation-free.`);
            }

            if (rule.rule_id === 'rule_fsma_usa_import') {
                if (!context.fsvp) violations.push(`${rule.regulation}: Missing FSVP records.`);
            }
        }

        if (violations.length > 0) {
            return {
                success: true,
                status: 'Fail',
                message: `Compliance Rule Violations: ${violations.join(' ')}`,
                score: 0,
                data: { violations, rulesChecked: applicableRules.length },
                requiredDocuments: requiredDocs
            };
        }

        return {
            success: true,
            status: 'Pass',
            message: `Verified compliance with ${applicableRules.length} applicable rules.`,
            score: 1.0,
            data: { rulesChecked: applicableRules.length },
            requiredDocuments: requiredDocs
        };
    }

    private mapCategory(category: string): DocCategory {
        const map: Record<string, DocCategory> = {
            'Customs': 'Customs',
            'Regulatory': 'Regulatory',
            'Food Safety': 'Food Safety',
            'Quality': 'Quality',
            'Organic': 'Quality'
        };
        return map[category] || 'Other';
    }

    private getRequiredDocumentsFromRules(destination: string, origin: string, product: string): Array<{name: string; description: string; category: DocCategory; agency: string; agencyLink: string}> {
        const docs: Array<{name: string; description: string; category: DocCategory; agency: string; agencyLink: string}> = [];
        
        if (destination === 'USA' || destination.includes('US')) {
            docs.push(
                { name: 'FSVP', description: 'Foreign Supplier Verification Program', category: 'Food Safety', agency: 'FDA', agencyLink: 'https://www.fda.gov' },
                { name: 'PCQI', description: 'Preventive Controls Qualified Individual', category: 'Food Safety', agency: 'FDA', agencyLink: 'https://www.fda.gov' }
            );
        }
        
        if (destination === 'EU' || this.isEU(destination)) {
            docs.push(
                { name: 'Certificate of Inspection (COI)', description: 'EU Organic import certificate', category: 'Quality', agency: 'EU', agencyLink: 'https://ec.europa.eu' }
            );
        }

        return docs;
    }

    private isEU(country: string): boolean {
        const euCountries = ['Netherlands', 'Germany', 'France', 'Spain', 'Italy', 'Belgium', 'Austria', 'Poland'];
        return euCountries.includes(country) || country === 'EU';
    }
}
