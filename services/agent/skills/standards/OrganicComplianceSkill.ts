
import { ISkill, SkillCategory, SkillContext, SkillResult } from '../../types';

interface OrganicStandard {
    id: string;
    name: string;
    regions: string[]; // Countries/Regions where this standard is the primary requirement
    equivalencies: string[]; // IDs of other standards accepted as equivalent
}

const GLOBAL_ORGANIC_STANDARDS: OrganicStandard[] = [
    {
        id: 'USDA_NOP',
        name: 'USDA National Organic Program',
        regions: ['USA', 'United States', 'US'],
        equivalencies: ['EU_ORGANIC', 'COR', 'JAS', 'KOREA_ORGANIC', 'UK_ORGANIC', 'EUTA_CH', 'EUTA_TW'] // Simplified list
    },
    {
        id: 'EU_ORGANIC',
        name: 'EU Organic (Regulation (EU) 2018/848)',
        regions: ['EU', 'Netherlands', 'Germany', 'France', 'Spain', 'Italy', 'Belgium', 'Austria', 'Poland', 'Sweden', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Greece', 'European Union'],
        equivalencies: ['USDA_NOP', 'COR', 'JAS', 'UK_ORGANIC', 'KOREA_ORGANIC', 'ACO', 'OOAP']
    },
    {
        id: 'JAS',
        name: 'Japanese Agricultural Standards',
        regions: ['Japan', 'JP'],
        equivalencies: ['USDA_NOP', 'EU_ORGANIC', 'COR', 'UK_ORGANIC', 'ACO', 'OOAP']
    },
    {
        id: 'COR',
        name: 'Canada Organic Regime',
        regions: ['Canada', 'CA'],
        equivalencies: ['USDA_NOP', 'EU_ORGANIC', 'JAS', 'UK_ORGANIC']
    },
    {
        id: 'CHINA_ORGANIC',
        name: 'China Organic (GB/T 19630)',
        regions: ['China', 'CN'],
        equivalencies: [] // China traditionally requires its own certification, minimal equivalency
    },
    {
        id: 'KOREA_ORGANIC',
        name: 'Korea Organic (MAFRA/NAQS)',
        regions: ['South Korea', 'Korea', 'KR'],
        equivalencies: ['USDA_NOP', 'EU_ORGANIC']
    },
    {
        id: 'UK_ORGANIC',
        name: 'UK Organic (GB Organic)',
        regions: ['UK', 'United Kingdom', 'Great Britain'],
        equivalencies: ['EU_ORGANIC', 'USDA_NOP', 'COR', 'JAS']
    },
    {
        id: 'ACO',
        name: 'Australian Certified Organic / National Standard',
        regions: ['Australia', 'AU'],
        equivalencies: ['EU_ORGANIC', 'JAS', 'USDA_NOP'] // Partial or private standard recognition
    },
    {
        id: 'OOAP',
        name: 'New Zealand Official Organic Assurance Programme',
        regions: ['New Zealand', 'NZ'],
        equivalencies: ['EU_ORGANIC', 'JAS', 'USDA_NOP']
    },
    {
        id: 'KOREA_ORGANIC',
        name: 'Korea Organic (MAFRA/NAQS)',
        regions: ['South Korea', 'Korea', 'KR'],
        equivalencies: ['USDA_NOP', 'EU_ORGANIC']
    },
    {
        id: 'UK_ORGANIC',
        name: 'UK Organic (GB Organic)',
        regions: ['UK', 'United Kingdom', 'Great Britain'],
        equivalencies: ['EU_ORGANIC', 'USDA_NOP', 'COR', 'JAS']
    },
    {
        id: 'ACO',
        name: 'Australian Certified Organic / National Standard',
        regions: ['Australia', 'AU'],
        equivalencies: ['EU_ORGANIC', 'JAS', 'USDA_NOP'] // Partial or private standard recognition
    },
    {
        id: 'OOAP',
        name: 'New Zealand Official Organic Assurance Programme',
        regions: ['New Zealand', 'NZ'],
        equivalencies: ['EU_ORGANIC', 'JAS', 'USDA_NOP']
    }
];

export class OrganicComplianceSkill implements ISkill {
    public id = 'organic_compliance_skill';
    public name = 'Organic Sentinel';
    public category = SkillCategory.STANDARDS;
    public description = 'Validates organic compliance across global standards (USDA, EU, JAS, COR, China, KR, AU, NZ, UK) including equivalency arrangements.';

    async execute(context: SkillContext): Promise<SkillResult> {
        const { metadata } = context;

        // 1. Identify Destination Standard
        const destination = metadata.destination || 'unknown';
        const requiredStandard = this.getStandardForRegion(destination);

        if (!requiredStandard) {
            return {
                success: true,
                confidence: 0.5,
                data: {
                    message: `No specific organic mandate found for destination: ${destination}. Assuming generic organic compliance is sufficient.`
                },
                requiresHumanReview: false,
                verdict: 'COMPLIANT',
                auditLog: []
            };
        }

        // 2. Identify Provided Certification
        // In a real scenario, this would come from `files` analysis or explicit metadata.
        // We'll look for a metadata field `certificationType` or similar.
        const providedCertId = metadata.certificationType; // e.g., 'USDA_NOP'

        if (!providedCertId) {
            return {
                success: true,
                confidence: 1.0,
                data: {
                    compliant: false,
                    reason: `Generated Organic Check: Missing certification type for ${destination}.`
                },
                requiresHumanReview: true,
                verdict: 'NON_COMPLIANT',
                errors: [`Missing organic certification. ${destination} requires ${requiredStandard.name}.`],
                auditLog: []
            };
        }

        // 3. Validate Compliance (Direct or Equivalence)
        const isDirectMatch = providedCertId === requiredStandard.id;
        const isEquivalent = requiredStandard.equivalencies.includes(providedCertId);

        if (isDirectMatch) {
            return {
                success: true,
                confidence: 1.0,
                data: {
                    compliant: true,
                    path: 'Direct Certification',
                    standard: requiredStandard.name
                },
                requiresHumanReview: false,
                verdict: 'COMPLIANT',
                auditLog: [{
                    timestamp: new Date().toISOString(),
                    action: 'CERT_VALIDATED',
                    details: `Direct match: ${providedCertId} is valid for ${destination}.`
                }]
            };
        } else if (isEquivalent) {
            return {
                success: true,
                confidence: 0.95,
                data: {
                    compliant: true,
                    path: 'Equivalency Arrangement',
                    standard: requiredStandard.name,
                    acceptedCert: providedCertId
                },
                requiresHumanReview: false,
                verdict: 'COMPLIANT',
                auditLog: [{
                    timestamp: new Date().toISOString(),
                    action: 'EQUIVALENCE_VALIDATED',
                    details: `${providedCertId} accepted in ${destination} via equivalency.`
                }]
            };
        } else {
            return {
                success: true,
                confidence: 1.0,
                data: {
                    compliant: false,
                    reason: `Certification Mismatch`,
                    required: requiredStandard.name,
                    provided: providedCertId
                },
                requiresHumanReview: true,
                verdict: 'NON_COMPLIANT',
                errors: [`${providedCertId} is NOT accepted in ${destination}. Requires ${requiredStandard.name} or equivalent.`],
                auditLog: []
            };
        }
    }

    async validateContext(context: SkillContext): Promise<boolean> {
        // Only run if the product is marked as Organic
        const product = context.metadata.product || '';
        const attributes = context.metadata.attributes || [];
        // Check if 'Organic' is in product name or attributes
        return product.toLowerCase().includes('organic') || attributes.includes('Organic');
    }

    private getStandardForRegion(region: string): OrganicStandard | undefined {
        return GLOBAL_ORGANIC_STANDARDS.find(std =>
            std.regions.some(r => r.toLowerCase() === region.toLowerCase())
        );
    }
}
