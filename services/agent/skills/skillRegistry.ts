import { SkillResult, ISkill, SkillContext } from '../types';
import * as AllSkills from './index';

// Re-export for backward compatibility with old skills
export type { SkillResult };
export type { SkillContext };

// Re-export ISkill as Skill for compatibility if needed, or replace usages.
export type Skill = ISkill;


export class SkillRegistry {
    private skills: Map<string, Skill> = new Map();
    private loadErrors: string[] = [];

    constructor() {
        // Auto-discover and register all skills dynamically (Guardian Agent pattern)
        console.log('[SkillRegistry] Starting auto-discovery...');
        console.log('[SkillRegistry] Available exports from index:', Object.keys(AllSkills).filter(k => typeof AllSkills[k] === 'function').join(', '));
        
        Object.entries(AllSkills).forEach(([name, SkillClass]: [string, any]) => {
            if (typeof SkillClass === 'function' && name !== 'SkillRegistry') {
                try {
                    const skillInstance = new SkillClass();
                    if (skillInstance && typeof skillInstance === 'object' && 'id' in skillInstance && 'execute' in skillInstance) {
                        this.skills.set(skillInstance.id, skillInstance);
                        console.log(`[SkillRegistry] ✓ Loaded: ${skillInstance.id} (${skillInstance.name})`);
                    } else {
                        console.warn(`[SkillRegistry] ✗ Skipped "${name}": missing id/execute`);
                    }
                } catch (e: any) {
                    const errorMsg = `Failed to load "${name}": ${e.message}`;
                    this.loadErrors.push(errorMsg);
                    console.warn(`[SkillRegistry] ✗ ${errorMsg}`);
                }
            }
        });
        
        console.log(`[SkillRegistry] =========================================`);
        console.log(`[SkillRegistry] ✓ Auto-loaded ${this.skills.size} skills successfully`);
        if (this.loadErrors.length > 0) {
            console.log(`[SkillRegistry] ✗ ${this.loadErrors.length} skills failed to load:`);
            this.loadErrors.forEach(e => console.log(`[SkillRegistry]   - ${e}`));
        }
        console.log(`[SkillRegistry] =========================================`);
        
        // Group by category for summary
        const byCategory: Record<string, string[]> = {};
        this.skills.forEach((skill, id) => {
            const cat = skill.category || 'uncategorized';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(id);
        });
        console.log('[SkillRegistry] Skills by category:');
        Object.entries(byCategory).forEach(([cat, ids]) => {
            console.log(`[SkillRegistry]   ${cat}: ${ids.length} (${ids.join(', ')})`);
        });
    }

    register(skill: Skill) {
        console.log(`[SkillRegistry] + Registered skill: ${skill.id}`);
        this.skills.set(skill.id, skill);
    }

    get(id: string): Skill | undefined {
        const skill = this.skills.get(id);
        if (!skill) {
            console.warn(`[SkillRegistry] Skill not found: ${id}`);
            console.log(`[SkillRegistry] Available skills: ${Array.from(this.skills.keys()).join(', ')}`);
        }
        return skill;
    }

    list(): Skill[] {
        return Array.from(this.skills.values());
    }
    
    getByCategory(category: string): Skill[] {
        return Array.from(this.skills.values()).filter(s => s.category === category);
    }
}
