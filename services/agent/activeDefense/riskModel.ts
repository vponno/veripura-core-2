export interface RiskProfile {
    matchKeywords: string[]; // e.g., ["soy", "soya"]
    gravityScore: number;    // 0.0 - 1.0
    auditConfig: {
        silentAudit: boolean;
        humanInterventionThreshold: number;
    };
}

export interface ActiveDefenseConfig {
    entropyThreshold: number; // 0.0 - 1.0 (e.g., 0.05 for 5%)
    globalRiskProfiles: RiskProfile[];
}

// Default/Fallback Configuration (can be overridden by remote config)
export const DEFAULT_RISK_CONFIG: ActiveDefenseConfig = {
    entropyThreshold: 0.05,
    globalRiskProfiles: []
};
