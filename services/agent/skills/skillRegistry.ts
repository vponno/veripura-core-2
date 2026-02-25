import { SkillResult, ISkill, SkillContext } from '../types';
import * as AllSkills from './index';

// Re-export for backward compatibility with old skills
export type { SkillResult };
export type { SkillContext };

// Re-export ISkill as Skill for compatibility if needed, or replace usages.
export type Skill = ISkill;


export class SkillRegistry {
    private static instance: SkillRegistry;
    private skills: Map<string, Skill> = new Map();
    private loadErrors: string[] = [];

    static getInstance(): SkillRegistry {
        if (!SkillRegistry.instance) {
            SkillRegistry.instance = new SkillRegistry();
        }
        return SkillRegistry.instance;
    }

    constructor() {
        // Auto-discover and register all skills dynamically (Guardian Agent pattern)
        console.log('[SkillRegistry] Starting auto-discovery...');
        console.log('[SkillRegistry] Available exports from index:', Object.keys(AllSkills).filter(k => typeof AllSkills[k] === 'function').join(', '));

        Object.entries(AllSkills).forEach(([name, SkillClass]: [string, any]) => {
            // Guardian Agent Pattern: Only instantiate functions that look like classes (uppercase start)
            // AND are not explicitly excluded helpers/instances.
            const isProbablyClass = typeof SkillClass === 'function' && /^[A-Z]/.test(name);
            const isExcluded = [
                'SkillRegistry',
                'SkillLearningEngine',
                'ConsignmentMerkleTree',
                'SkillChainingEngine',
                'SkillTelemetry',
                'ReliabilityFallbackEngine'
            ].includes(name);

            if (isProbablyClass && !isExcluded) {
                try {
                    const skillInstance = new SkillClass();
                    if (skillInstance && typeof skillInstance === 'object' && 'id' in skillInstance && 'execute' in skillInstance) {
                        this.skills.set(skillInstance.id, skillInstance);
                        console.log(`[SkillRegistry] ✓ Loaded: ${skillInstance.id} (${skillInstance.name})`);
                    }
                } catch (e: any) {
                    // Silently fail for non-constructable functions that started with uppercase (safety check)
                    if (!e.message.includes('is not a constructor')) {
                        const errorMsg = `Failed to load "${name}": ${e.message}`;
                        this.loadErrors.push(errorMsg);
                        console.warn(`[SkillRegistry] ✗ ${errorMsg}`);
                    }
                }
            }
        });

        // ---------------------------------------------------------
        // ALIASES for backward compatibility or naming mismatches
        // ---------------------------------------------------------
        const aliases: Record<string, string> = {
            'document_analysis': 'document_analysis_skill',
            'labeling_compliance': 'labeling_compliance_skill',
        };

        Object.entries(aliases).forEach(([alias, actualId]) => {
            const skill = this.skills.get(actualId);
            if (skill) {
                this.skills.set(alias, skill);
                console.log(`[SkillRegistry] ⚡ Alias added: ${alias} -> ${actualId}`);
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

    /**
     * Get all registered skills (alias for list()).
     */
    getAllSkills(): Skill[] {
        return this.list();
    }

    /**
     * Execute a skill by ID with the given context.
     */
    async executeSkill(id: string, context: SkillContext): Promise<SkillResult> {
        const skill = this.get(id);

        if (!skill) {
            return {
                success: false,
                confidence: 0,
                errors: [`Skill not found: ${id}`],
                auditLog: [{
                    timestamp: new Date().toISOString(),
                    action: 'EXECUTE_FAILED',
                    details: `Skill not found: ${id}`
                }]
            };
        }

        try {
            return await skill.execute(context);
        } catch (error: any) {
            return {
                success: false,
                confidence: 0,
                errors: [error.message || 'Unknown error'],
                auditLog: [{
                    timestamp: new Date().toISOString(),
                    action: 'EXECUTE_ERROR',
                    details: error.message || 'Unknown error'
                }]
            };
        }
    }
}
