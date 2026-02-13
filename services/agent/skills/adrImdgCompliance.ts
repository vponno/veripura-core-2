import { Skill, SkillResult } from './skillRegistry';

export interface ADRIMDGInput {
    unNumber: string;
    properShippingName: string;
    hazardClass: string;
    packingGroup?: 'I' | 'II' | 'III';
    quantity: number;
    unit: string;
    transportMode: 'road' | 'sea' | 'air' | 'rail';
    packaging?: {
        type: string;
        quantity: number;
    };
}

interface HazardInfo {
    class: string;
    label: string;
    properShippingName: string;
    packingGroup: string;
    restrictions: string[];
    packagingRequirements: string[];
    requiredDocs: string[];
}

export class ADRIMDGComplianceSkill implements Skill {
    id = 'adr_imdg_compliance';
    name = 'ADR/IMDG Specialist';
    description = 'Classifies dangerous goods (hazmat) and verifies labeling/packaging for transport per UN Dangerous Goods List.';

    private hazmatDatabase: Map<string, HazardInfo> = new Map([
        ['UN1203', { class: '3', label: 'Flammable Liquid', properShippingName: 'Gasoline', packingGroup: 'II', restrictions: ['No passengers'], packagingRequirements: ['UN approved packaging', 'Label Class 3'], requiredDocs: ['MSDS', 'Dangerous Goods Declaration'] }],
        ['UN1017', { class: '2.3', label: 'Toxic Gas', properShippingName: 'Chlorine', packingGroup: 'N/A', restrictions: ['Forbidden passenger aircraft'], packagingRequirements: ['Pressure vessels', 'Toxic label'], requiredDocs: ['MSDS', 'DGD', 'Emergency Response Guide'] }],
        ['UN1202', { class: '3', label: 'Flammable Liquid', properShippingName: 'Diesel Fuel', packingGroup: 'III', restrictions: ['Limited quantity'], packagingRequirements: ['Standard packaging', 'Label Class 3'], requiredDocs: ['MSDS'] }],
        ['UN1789', { class: '8', label: 'Corrosive', properShippingName: 'Hydrochloric Acid', packingGroup: 'II', restrictions: ['Segregation required'], packagingRequirements: ['Corrosive label', 'Packing group II'], requiredDocs: ['MSDS', 'Dangerous Goods Declaration'] }],
        ['UN1993', { class: '3', label: 'Flammable Liquid', properShippingName: 'Flammable Liquid NOS', packingGroup: 'III', restrictions: ['Limited quantity'], packagingRequirements: ['Class 3 label'], requiredDocs: ['MSDS'] }],
    ]);

    async execute(input: ADRIMDGInput): Promise<SkillResult> {
        const { unNumber, properShippingName, hazardClass, packingGroup, quantity, unit, transportMode, packaging } = input;

        const hazmat = this.hazmatDatabase.get(unNumber);
        
        const issues: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];
        let severity: 'info' | 'warning' | 'critical' = 'info';
        let status = 'Pass';

        if (!hazmat) {
            warnings.push(`UN Number ${unNumber} not found in database - verify it's valid`);
            severity = 'warning';
        } else {
            if (hazmat.class !== hazardClass) {
                issues.push(`HAZARD CLASS MISMATCH: Declared ${hazardClass}, should be ${hazmat.class}`);
                severity = 'critical';
                status = 'Fail';
            }

            if (packingGroup && hazmat.packingGroup !== 'N/A' && packingGroup !== hazmat.packingGroup) {
                issues.push(`PACKING GROUP MISMATCH: Declared ${packingGroup}, should be ${hazmat.packingGroup}`);
                severity = 'critical';
                status = 'Fail';
            }

            if (transportMode === 'air' && hazmat.restrictions.some(r => r.includes('passenger'))) {
                issues.push(`AIR TRANSPORT RESTRICTION: ${hazmat.restrictions.find(r => r.includes('passenger'))}`);
                severity = 'critical';
                status = 'Fail';
            }

            hazmat.restrictions.forEach(r => {
                if (r.includes('Segregation')) {
                    warnings.push('Segregation required - verify incompatible goods not co-loaded');
                }
                if (r.includes('Limited')) {
                    info.push(r);
                }
            });
        }

        const limitedQuantityThreshold = 1000;
        const limitedQuantity = unit === 'kg' && quantity < limitedQuantityThreshold;

        if (!limitedQuantity && hazmat?.restrictions.includes('Limited quantity')) {
            warnings.push('Quantity exceeds limited quantity threshold - full DGD required');
            if (severity !== 'critical') severity = 'warning';
            if (status !== 'Fail') status = 'Warning';
        }

        if (transportMode === 'sea' && !hazmat?.requiredDocs.includes('Dangerous Goods Declaration')) {
            warnings.push('Verify IMDG requirements for sea transport');
        }

        return {
            success: status !== 'Fail',
            status,
            message: severity === 'critical' 
                ? `NON-COMPLIANT: ${issues.join('. ')}`
                : warnings.length > 0 
                    ? `COMPLIANCE WARNING: ${warnings.join('. ')}`
                    : `Compliant: ${properShippingName} (Class ${hazardClass})`,
            score: severity === 'critical' ? 0 : severity === 'warning' ? 0.7 : 1.0,
            data: {
                unNumber,
                properShippingName,
                hazardClass,
                packingGroup: packingGroup || hazmat?.packingGroup,
                transportMode,
                classification: hazmat ? {
                    label: hazmat.label,
                    restrictions: hazmat.restrictions,
                    packagingRequirements: hazmat.packagingRequirements,
                    requiredDocs: hazmat.requiredDocs
                } : null,
                issues,
                warnings,
                info,
                limitedQuantity,
                recommendation: this.getRecommendation(severity, issues, warnings, hazmat)
            }
        };
    }

    private getRecommendation(severity: string, issues: string[], warnings: string[], hazmat?: HazardInfo): string {
        if (severity === 'critical') {
            return 'DO NOT SHIP: Fix classification errors before transport';
        }
        if (warnings.length > 0) {
            return 'VERIFY: Review warnings and ensure all required documentation is present';
        }
        if (hazmat) {
            return `PROCEED: Ensure ${hazmat.packagingRequirements.join(', ')} and ${hazmat.requiredDocs.join(', ')} are available`;
        }
        return 'VERIFY: Confirm UN number and classification';
    }
}
