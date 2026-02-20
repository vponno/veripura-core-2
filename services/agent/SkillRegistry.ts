import { ISkill, SkillCategory, SkillContext, SkillResult } from './types';
import { logger } from '../lib/logger';

export class SkillRegistry {
  private static instance: SkillRegistry;
  private skills: Map<string, ISkill> = new Map();

  private constructor() { }

  public static getInstance(): SkillRegistry {
    if (!SkillRegistry.instance) {
      SkillRegistry.instance = new SkillRegistry();
    }
    return SkillRegistry.instance;
  }

  /**
   * Register a new skill in the ecosystem.
   */
  register(skill: ISkill) {
    if (this.skills.has(skill.id)) {
      console.warn(`[SkillRegistry] Overwriting existing skill: ${skill.id}`);
    }
    this.skills.set(skill.id, skill);
    logger.log(`[SkillRegistry] Registered skill: ${skill.id} (${skill.category})`);
  }

  /**
   * Retrieve a skill by its unique ID.
   */
  getSkill(id: string): ISkill | undefined {
    return this.skills.get(id);
  }

  /**
   * Get all skills belonging to a specific category.
   */
  getSkillsByCategory(category: SkillCategory): ISkill[] {
    return Array.from(this.skills.values()).filter(s => s.category === category);
  }

  /**
   * Get all registered skills.
   */
  getAllSkills(): ISkill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Execute a specific skill by ID with the given context.
   */
  async executeSkill(id: string, context: SkillContext): Promise<SkillResult> {
    const skill = this.getSkill(id);

    if (!skill) {
      return {
        success: false,
        data: null,
        confidence: 0,
        requiresHumanReview: true,
        auditLog: [{
          timestamp: new Date().toISOString(),
          action: 'EXECUTION_FAILED',
          details: `Skill not found: ${id}`
        }],
        errors: [`Skill ${id} not found in registry`]
      };
    }

    try {
      if (skill.validateContext) {
        const isValid = await skill.validateContext(context);
        if (!isValid) {
          return {
            success: false,
            data: null,
            confidence: 0,
            requiresHumanReview: true,
            auditLog: [{
              timestamp: new Date().toISOString(),
              action: 'VALIDATION_FAILED',
              details: `Context validation failed for skill: ${id}`
            }],
            errors: [`Invalid context for skill ${id}`]
          };
        }
      }

      logger.log(`[SkillRegistry] Executing skill: ${id}`);
      return await skill.execute(context);
    } catch (error: any) {
      console.error(`[SkillRegistry] Error executing skill ${id}:`, error);
      return {
        success: false,
        data: null,
        confidence: 0,
        requiresHumanReview: true,
        auditLog: [{
          timestamp: new Date().toISOString(),
          action: 'EXECUTION_ERROR',
          details: error.message || 'Unknown error'
        }],
        errors: [error.message || 'Unknown execution error']
      };
    }
  }
}
