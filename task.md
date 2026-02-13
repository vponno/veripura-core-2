# Project Task List

## 0. Strategic Brainstorming (Completed)

* [x] Identify missing "Major Domains" beyond Regulation/Logistics/Commercial.
* [x] Define "Holistic Guardian" scope (Finance & Quality).

## 1. Project Architecture Review (Completed)

* [x] Audit `agentService.ts` against "Guardian Agent" vision
* [x] Update `bizlogic.md` with full capabilities (Skills, Memory, RAG)
* [x] Create Technical Disclosure for Patent Application (`patent_disclosure_draft.md`)

## 2. Refactoring to Agentic Architecture (Completed)

* [x] **Finalize Implementation Plan**: Clear technical debt and restore `plans/guardian-agent-implementation-plan.md`.
* [x] **Define Guardian Agent Types**: Add `AgentState`, `Memory`, and `KnowledgeGraph` types to `types.ts`.
* [x] **Refactor `consignmentService`**: Decouple "Guardian" logic into `AgentCore`.
* [x] **Implement `SkillRegistry`**: Formalize capabilities as `AgentSkill` interface.

## 3. Sub-Agent Implementation (Completed)

* [x] Create `SubAgent` abstract class.
* [x] Implement `EUDRSpecialist` (Example sub-agent).

## 4. VeriPura AI & RLHF (Completed)

* [x] Implement RAG lookup in `complianceService` (query `training_dataset`).
* [x] Create feedback UI for "Admin Decision" (Golden Labeling).

## 5. Regulatory Watchers (Completed)

* [x] Design `RegulatoryWatcher` sub-agent pattern (Cron + Scraper).
* [x] **Data Source Integration**: Implement **Bright Data MCP** for robust scraping.
* [x] Implement "Rule Update Proposal" workflow in Admin UI.
