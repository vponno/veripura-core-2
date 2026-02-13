import { Skill, SkillResult } from './skillRegistry';

export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    fallbackMethod: 'regex' | 'cache' | 'default' | 'skip';
}

export interface CircuitBreakerState {
    skillId: string;
    state: 'closed' | 'open' | 'half_open';
    failureCount: number;
    successCount: number;
    lastFailureTime?: number;
    nextAttempt?: number;
}

export interface ReliabilityFallbackInput {
    action: 'execute' | 'status' | 'reset';
    skillId: string;
    primaryExecute?: () => Promise<SkillResult>;
    fallbackConfig?: CircuitBreakerConfig;
    fallbackData?: any;
}

export class ReliabilityFallbackSkill implements Skill {
    id = 'reliability_fallback';
    name = 'Circuit Breaker & Fallback';
    description = 'Detects API failures or timeouts and triggers deterministic fallback logic (e.g., regex vs. LLM).';

    private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
    private defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 30000,
        fallbackMethod: 'default'
    };

    async execute(input: ReliabilityFallbackInput): Promise<SkillResult> {
        const { action, skillId, primaryExecute, fallbackConfig, fallbackData } = input;

        switch (action) {
            case 'execute':
                return this.executeWithFallback(skillId, primaryExecute!, fallbackConfig || this.defaultConfig, fallbackData);
            case 'status':
                return this.getCircuitBreakerStatus(skillId);
            case 'reset':
                return this.resetCircuitBreaker(skillId);
            default:
                return {
                    success: false,
                    status: 'Fail',
                    message: `Unknown action: ${action}`,
                    score: 0
                };
        }
    }

    private async executeWithFallback(
        skillId: string,
        primaryExecute: () => Promise<SkillResult>,
        config: CircuitBreakerConfig,
        fallbackData?: any
    ): Promise<SkillResult> {
        const state = this.getOrCreateCircuitBreaker(skillId, config);

        if (state.state === 'open') {
            if (state.nextAttempt && Date.now() < state.nextAttempt) {
                return this.applyFallback(skillId, config, fallbackData, 'Circuit open: too many failures');
            }
            state.state = 'half_open';
        }

        try {
            const result = await this.executeWithTimeout(primaryExecute, 10000);
            
            this.onSuccess(skillId, config);
            
            return {
                ...result,
                data: {
                    ...result.data,
                    _circuitBreaker: {
                        state: this.circuitBreakers.get(skillId)?.state,
                        method: 'primary'
                    }
                }
            };
        } catch (error: any) {
            this.onFailure(skillId, config);
            
            return this.applyFallback(skillId, config, fallbackData, error.message);
        }
    }

    private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) => 
                setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
            )
        ]);
    }

    private applyFallback(skillId: string, config: CircuitBreakerConfig, fallbackData: any, error: string): SkillResult {
        const fallbackMethods: Record<string, () => SkillResult> = {
            regex: () => ({
                success: true,
                status: 'Warning',
                message: `Fallback (regex): Primary failed - ${error}. Using pattern matching.`,
                score: 0.6,
                data: { method: 'regex', originalError: error }
            }),
            cache: () => ({
                success: true,
                status: 'Warning',
                message: `Fallback (cache): Primary failed - ${error}. Using cached data.`,
                score: 0.7,
                data: { method: 'cache', cachedData: fallbackData, originalError: error }
            }),
            default: () => ({
                success: true,
                status: 'Warning',
                message: `Fallback (default): Primary failed - ${error}. Using default response.`,
                score: 0.5,
                data: { method: 'default', originalError: error }
            }),
            skip: () => ({
                success: false,
                status: 'Fail',
                message: `Execution skipped: Primary failed - ${error}.`,
                score: 0,
                data: { method: 'skipped', originalError: error }
            })
        };

        const fallback = fallbackMethods[config.fallbackMethod] || fallbackMethods['default'];
        const result = fallback();
        
        return {
            ...result,
            data: {
                ...result.data,
                _circuitBreaker: {
                    state: this.circuitBreakers.get(skillId)?.state,
                    method: 'fallback'
                }
            }
        };
    }

    private getOrCreateCircuitBreaker(skillId: string, config: CircuitBreakerConfig): CircuitBreakerState {
        if (!this.circuitBreakers.has(skillId)) {
            this.circuitBreakers.set(skillId, {
                skillId,
                state: 'closed',
                failureCount: 0,
                successCount: 0
            });
        }
        return this.circuitBreakers.get(skillId)!;
    }

    private onSuccess(skillId: string, config: CircuitBreakerConfig): void {
        const state = this.circuitBreakers.get(skillId)!;
        
        if (state.state === 'half_open') {
            state.successCount++;
            if (state.successCount >= config.successThreshold) {
                state.state = 'closed';
                state.failureCount = 0;
                state.successCount = 0;
            }
        } else {
            state.failureCount = 0;
        }
    }

    private onFailure(skillId: string, config: CircuitBreakerConfig): void {
        const state = this.circuitBreakers.get(skillId)!;
        
        state.failureCount++;
        state.lastFailureTime = Date.now();
        
        if (state.failureCount >= config.failureThreshold) {
            state.state = 'open';
            state.nextAttempt = Date.now() + config.timeout;
            state.successCount = 0;
        }
    }

    private getCircuitBreakerStatus(skillId: string): SkillResult {
        const state = this.circuitBreakers.get(skillId);
        
        if (!state) {
            return {
                success: true,
                status: 'Pass',
                message: `No circuit breaker found for skill: ${skillId}`,
                score: 1.0,
                data: { exists: false }
            };
        }

        return {
            success: true,
            status: 'Pass',
            message: `Circuit breaker status: ${state.state}`,
            score: 1.0,
            data: {
                exists: true,
                state: state.state,
                failureCount: state.failureCount,
                successCount: state.successCount,
                lastFailureTime: state.lastFailureTime,
                nextAttempt: state.nextAttempt
            }
        };
    }

    private resetCircuitBreaker(skillId: string): SkillResult {
        this.circuitBreakers.delete(skillId);
        
        return {
            success: true,
            status: 'Pass',
            message: `Circuit breaker reset for skill: ${skillId}`,
            score: 1.0
        };
    }
}
