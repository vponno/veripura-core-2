
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
  confidence?: number; // 0.0 to 1.0
  requiresHumanReview?: boolean;
  verdict?: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'UNKNOWN';
  auditLog?: SkillAuditLog[];
  errors?: string[];

  // Backwards compatibility properties
  status?: string;
  message?: string;
  score?: number;
}

export interface ISkill<T = any> {
  id: string;
  name: string;
  category?: SkillCategory | string; // Allow string and optional for backwards compat
  description: string;

  /**
   * Primary execution method for the skill.
   */
  execute(context: T): Promise<SkillResult>;

  /**
   * Validates if the skill can run with the provided context (e.g. check for required files).
   */
  validateContext?(context: T): Promise<boolean>;
}
