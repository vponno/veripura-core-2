import { SkillResult, ISkill, SkillContext } from '../types';
import { RegulatoryCheckSkill } from './regulatory/RegulatoryCheckSkill';
import { OrganicComplianceSkill } from './standards/OrganicComplianceSkill';
import { SanctionsSentrySkill } from './regulatory/SanctionsSentrySkill';

export type { SkillResult };

export interface SkillInput extends SkillContext {
    documentId?: string;
    documentType?: string;
    textContent?: string;
    keywords?: string[];
    mode?: string;
    country?: string;
    shipment?: {
        origin?: string;
        destination?: string;
        product?: string;
        hsCode?: string;
        attributes?: unknown[];
    };
    [key: string]: unknown;
}

// Re-export ISkill as Skill for compatibility if needed, or replace usages.
export type Skill = ISkill;


export class SkillRegistry {
    private skills: Map<string, Skill> = new Map();

    constructor() {
        this.register(new RegulatoryCheckSkill());
        this.register(new OrganicComplianceSkill());
        this.register(new SanctionsSentrySkill());
    }

    register(skill: Skill) {
        this.skills.set(skill.id, skill);
    }

    get(id: string): Skill | undefined {
        return this.skills.get(id);
    }

    list(): Skill[] {
        return Array.from(this.skills.values());
    }
}
