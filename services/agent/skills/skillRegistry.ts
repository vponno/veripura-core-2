export interface SkillResult {
    success: boolean;
    status: string;
    message: string;
    data?: any;
    score: number;
    requiredDocuments?: Array<{
        name: string;
        description: string;
        category: 'Customs' | 'Regulatory' | 'Food Safety' | 'Quality' | 'Other';
        agency: string;
        agencyLink: string;
    }>;
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    execute: (input: any) => Promise<SkillResult>;
}

export class SkillRegistry {
    private skills: Map<string, Skill> = new Map();

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
