# Implementation Plan - Phase 1: The Guardian Core

## Goal Description

Transition from a monolithic `consignmentService` to a modular **Agentic Architecture**.
We will create the `AgentCore` (the orchestrator) and the `SkillRegistry` (the capabilities), allowing us to plug in "Forensics", "Compliance", and "IOTA Anchoring" as distinct skills.

## User Review Required

> [!IMPORTANT]
> **State Management**: Since we are on Firebase (Serverless), the "Stateful Agent" will act as a **Hydrated Entity**. It will not run permanently in background RAM. Instead, it will "wake up" (hydrate from `agentState` in Firestore), perform an action, update its state, and "sleep". This preserves the "One Agent" logical model without incurring 24/7 server costs.

## Proposed Changes

### 1. New Directory Structure (`services/agent/`)

We will create a dedicated domain for the agent logic to avoid cluttering the generic `services` folder.

#### [NEW] [types.ts](file:///Users/onno/veripura-core-final/services/agent/types.ts)

Definitions for `AgentContext`, `AgentMemory`, and the `AgentSkill` interface.

#### [NEW] [AgentCore.ts](file:///Users/onno/veripura-core-final/services/agent/AgentCore.ts)

The main class that:

1. **Hydrates**: Loads `consignment` + `agentState`.
2. **Orchestrates**: Selects and executes skills.
3. **Memories**: Updates the `structuredMemory` (Knowledge Graph).

#### [NEW] [SkillRegistry.ts](file:///Users/onno/veripura-core-final/services/agent/SkillRegistry.ts)

A singleton registry to manage available skills.

### 2. Migration of Logic

We will gradually move logic *out* of huge service files and *into* specific skills.

#### [NEW] [skills/ForensicSkill.ts](file:///Users/onno/veripura-core-final/services/agent/skills/ForensicSkill.ts)

* **Source**: Extract validation logic from `validationService.ts`.
* **Role**: Handles the "Tamper Score" and document analysis.

#### [NEW] [skills/RegulatorySkill.ts](file:///Users/onno/veripura-core-final/services/agent/skills/RegulatorySkill.ts)

* **Source**: Extract rule checking from `complianceService.ts`.
* **Role**: Handles BigQuery lookups and Rule Checks.

### 3. Cleanup

#### [MODIFY] [consignmentService.ts](file:///Users/onno/veripura-core-final/services/consignmentService.ts)

1. **Remove** direct validation calls.
2. **Replace** with `await AgentCore.wakeUp(consignmentId).processEvent('DOCUMENT_UPLOAD', { file })`.

## Verification Plan

### Automated Tests

* Create a unit test for `SkillRegistry` to ensure skills register correctly.
* Create a test for `AgentCore` hydration (loading state from a mock Firestore object).

### Manual Verification

* Upload a document in the UI.
* Verify logs show: `[AgentCore] Waking up...` -> `[Skill] ForensicSkill executing...` -> `[AgentCore] State updated.`

---

## Status: ✅ COMPLETE

All tasks in this implementation plan have been completed:

| Task | Status | Notes |
| :--- | :---: | :--- |
| Directory Structure (`services/agent/`) | ✅ | Created with types.ts, AgentCore, SkillRegistry |
| GuardianAgent.ts | ✅ | Main orchestrator with dynamic skill loading |
| SkillRegistry.ts | ✅ | Skill interface and registry implemented |
| Skills Migration | ✅ | 15+ skills implemented (RegulatoryCheck, Calculator, etc.) |
| SubAgent Architecture | ✅ | Abstract SubAgent class + 29 sub-agents |
| Knowledge Graph | ✅ | DependencyGraph with fact tracking |
| Active Defense | ✅ | Entropy audits and risk profiling |
| Cleanup | ✅ | GuardianAgent integration complete |
