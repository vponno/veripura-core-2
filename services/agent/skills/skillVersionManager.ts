import { Skill, SkillResult } from './skillRegistry';
import { SkillCategory } from '../types';

export interface SkillVersion {
    version: string;
    weight: number;
    enabled: boolean;
    config?: Record<string, any>;
}

export interface SkillVersionManagerInput {
    action: 'route' | 'register' | 'list' | 'update';
    skillId: string;
    version?: string;
    versions?: SkillVersion[];
    weights?: Record<string, number>;
}

export class SkillVersionManager implements Skill {
    id = 'skill_version_manager';
    name = 'Skill Version Manager';
    description = 'Routes requests to specific skill versions (v1 vs v2) to allow safe A/B testing and rollouts.';
    public category = SkillCategory.META;

    private versionRegistry: Map<string, SkillVersion[]> = new Map();

    async execute(input: SkillVersionManagerInput): Promise<SkillResult> {
        const { action, skillId, version, versions, weights } = input;

        switch (action) {
            case 'register':
                return this.registerVersions(skillId, versions!);
            case 'route':
                return this.routeToVersion(skillId, weights);
            case 'list':
                return this.listVersions(skillId);
            case 'update':
                return this.updateVersion(skillId, version!, weights);
            default:
                return {
                    success: false,
                    status: 'Fail',
                    message: `Unknown action: ${action}`,
                    score: 0
                };
        }
    }

    private registerVersions(skillId: string, versions: SkillVersion[]): SkillResult {
        if (!versions || versions.length === 0) {
            return {
                success: false,
                status: 'Fail',
                message: 'No versions provided',
                score: 0
            };
        }

        const totalWeight = versions.reduce((sum, v) => sum + (v.enabled ? v.weight : 0), 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
            return {
                success: false,
                status: 'Fail',
                message: `Weights must sum to 100, got ${totalWeight}`,
                score: 0
            };
        }

        this.versionRegistry.set(skillId, versions);

        return {
            success: true,
            status: 'Pass',
            message: `Registered ${versions.length} versions for skill: ${skillId}`,
            score: 1.0,
            data: { skillId, versions }
        };
    }

    private routeToVersion(skillId: string, customWeights?: Record<string, number>): SkillResult {
        const versions = this.versionRegistry.get(skillId);
        
        if (!versions || versions.length === 0) {
            const defaultVersion = 'v1';
            return {
                success: true,
                status: 'Pass',
                message: `No versions registered, defaulting to: ${defaultVersion}`,
                score: 1.0,
                data: { skillId, selectedVersion: defaultVersion, method: 'default' }
            };
        }

        const enabledVersions = versions.filter(v => v.enabled);
        
        if (enabledVersions.length === 0) {
            return {
                success: false,
                status: 'Fail',
                message: 'No enabled versions available',
                score: 0,
                data: { skillId }
            };
        }

        const weights = customWeights || Object.fromEntries(
            enabledVersions.map(v => [v.version, v.weight])
        );

        const random = Math.random() * 100;
        let cumulative = 0;
        let selectedVersion = enabledVersions[0].version;

        for (const v of enabledVersions) {
            cumulative += weights[v.version] || v.weight;
            if (random <= cumulative) {
                selectedVersion = v.version;
                break;
            }
        }

        return {
            success: true,
            status: 'Pass',
            message: `Routed to version: ${selectedVersion}`,
            score: 1.0,
            data: {
                skillId,
                selectedVersion,
                method: customWeights ? 'custom_weighted' : 'weighted_random',
                weights,
                randomSeed: random
            }
        };
    }

    private listVersions(skillId: string): SkillResult {
        const versions = this.versionRegistry.get(skillId);
        
        if (!versions) {
            return {
                success: true,
                status: 'Pass',
                message: `No versions registered for skill: ${skillId}`,
                score: 1.0,
                data: { skillId, versions: [] }
            };
        }

        return {
            success: true,
            status: 'Pass',
            message: `Found ${versions.length} versions`,
            score: 1.0,
            data: { skillId, versions }
        };
    }

    private updateVersion(skillId: string, version: string, weights?: Record<string, number>): SkillResult {
        const versions = this.versionRegistry.get(skillId);
        
        if (!versions) {
            return {
                success: false,
                status: 'Fail',
                message: `Skill not found: ${skillId}`,
                score: 0
            };
        }

        if (weights) {
            versions.forEach(v => {
                if (weights[v.version] !== undefined) {
                    v.weight = weights[v.version];
                }
            });
        }

        const targetVersion = versions.find(v => v.version === version);
        if (targetVersion) {
            targetVersion.enabled = true;
        }

        return {
            success: true,
            status: 'Pass',
            message: `Updated versions for skill: ${skillId}`,
            score: 1.0,
            data: { skillId, versions }
        };
    }
}
