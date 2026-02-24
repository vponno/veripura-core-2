
export enum SkillCategory {
  REGULATORY = 'regulatory',
  STANDARDS = 'standards',
  ENVIRONMENTAL = 'environmental',
  IOT = 'iot',
  TRADE = 'trade',
  INTEGRITY = 'integrity',
  SOCIETAL = 'societal',
  HISTORICAL = 'historical',
  FINANCIAL = 'financial',
  QUALITY = 'quality',
  EMERGING = 'emerging',
  META = 'meta',
  HIGHRISK = 'highrisk',
  CRISIS = 'crisis',
  PACKAGING = 'packaging',
  CYBER = 'cyber',
  DEVOPS = 'devops',
  SCIENTIFIC = 'scientific'
}

export type LLMProvider = 'vertex' | 'openai' | 'huggingface' | 'anthropic';

export interface ModelConfig {
  provider: LLMProvider;
  modelId: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string; // Optional, can be resolved from env
}

export type OCRMode = 'fast' | 'accurate' | 'layout_preservation' | 'auto';

export interface SkillContext {
  consignmentId?: string;
  files?: File[];
  metadata?: Record<string, any>;
  params?: Record<string, any>; // Optional parameters for specific skill execution
  preferredModel?: string; // e.g., 'legal-expert', 'vision-pro'
  ocrMode?: OCRMode;
  [key: string]: any; // Backwards compatibility for old inputs
}

export interface SkillAuditLog {
  timestamp: string;
  action: string;
  details: string;
  source?: string;
}

export interface SkillResult {
  success: boolean;
  data?: any;
  confidence?: number;
  requiresHumanReview?: boolean;
  verdict?: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'UNKNOWN';
  auditLog?: SkillAuditLog[];
  errors?: string[];
  // Backwards compatibility - prefer using confidence/verdict instead
  status?: string;
  message?: string;
  score?: number;
}

export interface ISkill<T = SkillContext> {
  id: string;
  name: string;
  category?: SkillCategory | string;
  description: string;
  execute(input: T): Promise<SkillResult>;
  validateContext?(input: T): Promise<boolean>;
}

export abstract class BaseSkill<T = SkillContext> implements ISkill<T> {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract category?: SkillCategory | string;
  
  abstract execute(input: T): Promise<SkillResult>;
  
  async validateContext?(input: T): Promise<boolean> {
    return true;
  }
  
  protected createSuccess(data: any, options?: {
    confidence?: number;
    verdict?: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'UNKNOWN';
    message?: string;
  }): SkillResult {
    return {
      success: true,
      data,
      confidence: options?.confidence ?? 1.0,
      verdict: options?.verdict ?? 'COMPLIANT',
      message: options?.message,
      auditLog: [{
        timestamp: new Date().toISOString(),
        action: 'EXECUTE',
        details: `Skill ${this.id} executed successfully`
      }]
    };
  }
  
  protected createFailure(error: string, options?: {
    confidence?: number;
    verdict?: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'UNKNOWN';
  }): SkillResult {
    return {
      success: false,
      confidence: options?.confidence ?? 0,
      verdict: options?.verdict ?? 'NON_COMPLIANT',
      errors: [error],
      auditLog: [{
        timestamp: new Date().toISOString(),
        action: 'EXECUTE_FAILED',
        details: `Skill ${this.id} failed: ${error}`
      }]
    };
  }
}
