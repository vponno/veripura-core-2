import { Skill, SkillResult } from './skillRegistry';

export interface TariffOptimizerInput {
    product: string;
    hsCode: string;
    origin: string;
    destination: string;
    value?: number;
}

interface TradeAgreement {
    name: string;
    origin: string;
    destination: string;
    baseRate: number;
    preferentialRate: number;
    requirement: string;
    status: 'Active' | 'Revoked' | 'Negotiating';
}

export class TariffOptimizerSkill implements Skill {
    id = 'tariff_optimizer';
    name = 'Tariff Optimizer';
    description = 'Calculates import duties and identifies Free Trade Agreement (FTA) or GSP savings opportunities.';

    // Mock Database of Trade Agreements
    // In production, this would query an external Duty API or internal DB
    private agreements: TradeAgreement[] = [
        {
            name: 'EVFTA (EU-Vietnam Free Trade Agreement)',
            origin: 'Vietnam',
            destination: 'EU',
            baseRate: 0.12, // 12%
            preferentialRate: 0.0, // 0%
            requirement: 'EUR.1 Movement Certificate',
            status: 'Active'
        },
        {
            name: 'GSP (Generalised Scheme of Preferences)',
            origin: 'Brazil',
            destination: 'EU',
            baseRate: 0.14,
            preferentialRate: 0.08, // 8%
            requirement: 'Form A or REX Statement',
            status: 'Active'
        },
        {
            name: 'US-India Trade Relations',
            origin: 'India',
            destination: 'USA',
            baseRate: 0.06,
            preferentialRate: 0.06, // No reduction
            requirement: 'N/A',
            status: 'Revoked' // GSP revoked for India
        }
    ];

    async execute(input: TariffOptimizerInput): Promise<SkillResult> {
        const { product, hsCode, origin, destination, value = 0 } = input;

        // Normalize destination (e.g., Netherlands -> EU)
        const region = ['Netherlands', 'Germany', 'France', 'Spain', 'Italy'].includes(destination) ? 'EU' : destination;

        // Find applicable agreement
        const agreement = this.agreements.find(a =>
            (origin.includes(a.origin) || a.origin === 'Any') &&
            (region === a.destination || destination === a.destination)
        );

        if (!agreement) {
            return {
                success: true,
                status: 'Pass',
                message: `No preferential trade agreement found for ${origin} -> ${destination}. Standard MFN rates apply.`,
                score: 0.0,
                data: {
                    dutyRate: 0.10, // Assumed MFN generic rate
                    savings: 0,
                    agreement: null
                }
            };
        }

        const dutyRate = agreement.preferentialRate;
        const potentialSavings = (agreement.baseRate - agreement.preferentialRate) * value;

        if (agreement.status === 'Revoked') {
            return {
                success: true,
                status: 'Warning',
                message: `Warning: ${agreement.name} is ${agreement.status}. Standard duties apply.`,
                score: 0.0,
                data: {
                    dutyRate: agreement.baseRate,
                    savings: 0,
                    agreement: agreement.name
                }
            };
        }

        return {
            success: true,
            status: 'Pass',
            message: `Optimized Duty: ${agreement.preferentialRate * 100}% via ${agreement.name}. Requires: ${agreement.requirement}.`,
            score: 1.0,
            data: {
                dutyRate: agreement.preferentialRate,
                baseRate: agreement.baseRate,
                savings: potentialSavings > 0 ? potentialSavings : undefined,
                agreement: agreement.name,
                requirement: agreement.requirement
            }
        };
    }
}
