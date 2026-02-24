import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export interface DigitalProductPassportInput {
    productId: string;
    productCategory: string;
    components?: Array<{ material: string; origin: string; recyclable: boolean }>;
    repairabilityScore?: number;
    carbonFootprint?: number;
    sustainabilityClaims?: string[];
}

interface PassportDataSection {
    section: string;
    status: 'complete' | 'partial' | 'missing';
    data: any;
}

export class DigitalProductPassportSkill implements Skill {
    id = 'digital_product_passport';
    name = 'Digital Product Passport Builder';
    description = 'Assembles full lifecycle data (repairability, recycling, carbon footprint) for EU Digital Product Passports per CIRPASS/ESPR standards.';
    public category = SkillCategory.EMERGING;

    private requiredSections = [
        'product_identity',
        'materials',
        'environmental_impact',
        'circularity',
        'supply_chain'
    ];

    async execute(input: DigitalProductPassportInput): Promise<SkillResult> {
        const { productId, productCategory, components = [], repairabilityScore, carbonFootprint, sustainabilityClaims = [] } = input;

        const passport: PassportDataSection[] = [];
        const missing: string[] = [];
        const warnings: string[] = [];

        const identitySection = this.buildIdentitySection(productId, productCategory);
        passport.push(identitySection);
        if (identitySection.status === 'missing') missing.push('product_identity');

        const materialsSection = this.buildMaterialsSection(components);
        passport.push(materialsSection);
        if (materialsSection.status === 'missing') missing.push('materials');

        const environmentalSection = this.buildEnvironmentalSection(carbonFootprint);
        passport.push(environmentalSection);
        if (environmentalSection.status === 'missing') missing.push('environmental_impact');

        const circularitySection = this.buildCircularitySection(repairabilityScore, components);
        passport.push(circularitySection);
        if (circularitySection.status === 'missing') missing.push('circularity');

        const supplyChainSection = this.buildSupplyChainSection(components);
        passport.push(supplyChainSection);
        if (supplyChainSection.status === 'missing') missing.push('supply_chain');

        if (sustainabilityClaims.length > 0) {
            warnings.push(...this.validateClaims(sustainabilityClaims, productCategory));
        }

        const complianceScore = (passport.filter(s => s.status === 'complete').length / this.requiredSections.length) * 100;

        const dppStatus = complianceScore >= 80 ? 'Ready' : complianceScore >= 50 ? 'In Progress' : 'Incomplete';

        return {
            success: complianceScore >= 50,
            status: complianceScore >= 80 ? 'Pass' : complianceScore >= 50 ? 'Warning' : 'Fail',
            message: `DPP Compliance: ${complianceScore.toFixed(0)}% (${dppStatus}). ${missing.length} sections require attention.`,
            score: complianceScore / 100,
            data: {
                productId,
                productCategory,
                complianceScore,
                status: dppStatus,
                sections: passport,
                missingSections: missing,
                warnings,
                esprCompliance: complianceScore >= 80,
                recommendation: this.getRecommendation(complianceScore, missing)
            }
        };
    }

    private buildIdentitySection(productId: string, category: string): PassportDataSection {
        const hasData = !!productId && !!category;
        return {
            section: 'product_identity',
            status: hasData ? 'complete' : 'missing',
            data: hasData ? { productId, category, format: 'UUID' } : null
        };
    }

    private buildMaterialsSection(components: any[]): PassportDataSection {
        const hasData = components.length > 0 && components.every(c => c.material && c.origin);
        return {
            section: 'materials',
            status: hasData ? 'complete' : components.length > 0 ? 'partial' : 'missing',
            data: hasData ? { components, totalMaterials: components.length } : { components, note: 'Missing material or origin data' }
        };
    }

    private buildEnvironmentalSection(carbonFootprint?: number): PassportDataSection {
        const hasData = carbonFootprint !== undefined;
        return {
            section: 'environmental_impact',
            status: hasData ? 'complete' : 'missing',
            data: hasData ? { carbonFootprintKgCO2e: carbonFootprint, unit: 'kg CO2e', scope: 'product_lifecycle' } : null
        };
    }

    private buildCircularitySection(repairabilityScore?: number, components: any[] = []): PassportDataSection {
        const hasRepairability = repairabilityScore !== undefined;
        const recyclableCount = components.filter(c => c.recyclable).length;
        const hasRecyclability = components.length > 0 && recyclableCount > 0;

        return {
            section: 'circularity',
            status: hasRepairability || hasRecyclability ? 'complete' : 'missing',
            data: {
                repairabilityScore: repairabilityScore ?? null,
                recyclableComponents: recyclableCount,
                totalComponents: components.length,
                recyclabilityRate: components.length > 0 ? (recyclableCount / components.length) * 100 : 0
            }
        };
    }

    private buildSupplyChainSection(components: any[]): PassportDataSection {
        const hasOrigins = components.length > 0 && components.every(c => c.origin);
        return {
            section: 'supply_chain',
            status: hasOrigins ? 'complete' : components.length > 0 ? 'partial' : 'missing',
            data: hasOrigins ? { traceability: 'full', supplierCount: components.length } : { traceability: 'partial', note: 'Origin data incomplete' }
        };
    }

    private validateClaims(claims: string[], category: string): string[] {
        const warnings: string[] = [];
        const verifiedClaims = ['recyclable', 'biodegradable', 'organic', 'fair trade'];
        
        claims.forEach(claim => {
            if (!verifiedClaims.includes(claim.toLowerCase())) {
                warnings.push(`Unverified sustainability claim: "${claim}" - ensure ESPR substantiation`);
            }
        });

        return warnings;
    }

    private getRecommendation(score: number, missing: string[]): string {
        if (score >= 80) return 'Product passport is ESPR compliant. Ready for market.';
        if (missing.includes('environmental_impact')) return 'Add carbon footprint data to meet ESPR requirements';
        if (missing.includes('materials')) return 'Complete material disclosure for traceability';
        return `Complete ${missing.join(', ')} sections to achieve compliance`;
    }
}
