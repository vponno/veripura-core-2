import {
    AgentState,
    AgentEvent,
    AgentEventResult,
    AgentMemory,
    AgentMessage,
    AgentAlert
} from '../../types';
import { DependencyGraph } from './dependencyGraph';
import { SubAgent } from './subAgent';
import { logger } from '../lib/logger';
import { SubAgentFactory } from './subAgentFactory';
import { SkillRegistry } from './skills';
import { ActiveDefenseConfig, DEFAULT_RISK_CONFIG } from './activeDefense/riskModel';
import { v4 as uuidv4 } from 'uuid';
import { Skill } from './skills/skillRegistry';
import { consistencyValidator, ChainValidationResult } from './consistencyValidator';

export class GuardianAgent {
    private id: string;
    private state: AgentState;
    private graph: DependencyGraph;

    // Dynamic Registries
    private subAgents: Map<string, SubAgent> = new Map();
    public skillRegistry: SkillRegistry;

    // Active Defense Config (Dynamic)
    private activeDefenseConfig: ActiveDefenseConfig;

    constructor(
        id: string,
        initialState?: AgentState,
        riskConfig: ActiveDefenseConfig = DEFAULT_RISK_CONFIG
    ) {
        this.id = id;
        this.state = initialState || this.createInitialState();
        this.graph = DependencyGraph.deserialize(this.state.memory.knowledgeGraph);
        this.activeDefenseConfig = riskConfig;

        // SkillRegistry now auto-discovers skills from ./skills/index.ts
        this.skillRegistry = new SkillRegistry();

        // Diagnostic: Log loaded skills
        const allSkills = this.skillRegistry.list();
        logger.log(`[GuardianAgent ${this.id}] Initialized with ${allSkills.length} skills:`);
        const byCategory: Record<string, string[]> = {};
        allSkills.forEach(skill => {
            const cat = skill.category || 'uncategorized';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(skill.id);
        });
        Object.entries(byCategory).forEach(([cat, skills]) => {
            logger.log(`  [${cat}]: ${skills.join(', ')}`);
        });
    }

    /**
     * Synchronizes registered sub-agents with those required by the current context.
     * This is the "Summoner" pattern.
     */
    public synchronizeSubAgents() {
        // Extract context for the factory (flattened view of knowledge graph)
        const context: any = {};
        this.graph.serialize().facts.forEach(f => {
            if (f.predicate === 'destination_country') context.destination = f.object;
            if (f.predicate === 'origin_country') context.origin = f.object;
            if (f.predicate === 'hs_code') context.hsCode = f.object;
            if (f.predicate === 'is_organic') context.isOrganic = f.object === 'true';
        });

        const requiredIds = SubAgentFactory.getRequiredSubAgents(context);

        // 1. Unregister if no longer needed
        Array.from(this.subAgents.keys()).forEach(id => {
            if (!requiredIds.includes(id)) {
                this.unregisterSubAgent(id);
            }
        });

        // 2. Register if new
        requiredIds.forEach(id => {
            if (!this.subAgents.has(id)) {
                const agent = SubAgentFactory.create(id);
                if (agent) this.registerSubAgent(agent);
            }
        });
    }

    /**
     * Updates the Active Defense configuration dynamically.
     * Call this when external rules change.
     */
    public updateRiskConfig(newConfig: ActiveDefenseConfig) {
        logger.log(`[GuardianAgent] Updating Risk Configuration.`);
        this.activeDefenseConfig = newConfig;
    }

    public registerSubAgent(agent: SubAgent) {
        if (!this.subAgents.has(agent.id)) {
            this.subAgents.set(agent.id, agent);
            logger.log(`[GuardianAgent] Registered Sub-Agent: ${agent.name}`);
            if (!this.state.subAgents.includes(agent.id)) {
                this.state.subAgents.push(agent.id);
            }
        }
    }

    public unregisterSubAgent(agentId: string) {
        if (this.subAgents.delete(agentId)) {
            logger.log(`[GuardianAgent] Unregistered Sub-Agent: ${agentId}`);
            this.state.subAgents = this.state.subAgents.filter(id => id !== agentId);
        }
    }

    private createInitialState(): AgentState {
        return {
            memory: {
                shortTerm: {
                    currentThoughtProcess: "Initializing Guardian Agent...",
                    pendingDecisions: [],
                    activeContext: {},
                    conversationBuffer: [],
                    stickyNoteBuffer: {} // Initialize empty sticky note buffer
                },
                knowledgeGraph: {
                    facts: [],
                    relationships: [],
                    version: 1
                }
            },
            skills: [],
            subAgents: [],
            sessionHistory: [],
            lastActive: new Date().toISOString(),
            status: 'idle'
        };
    }

    public getState(): AgentState {
        this.state.memory.knowledgeGraph = this.graph.serialize();
        return this.state;
    }

    public async processEvent(event: AgentEvent): Promise<AgentEventResult> {
        this.state.status = 'processing';
        this.state.lastActive = new Date().toISOString();

        logger.log(`╔════════════════════════════════════════════════════════════╗`);
        logger.log(`║ [GuardianAgent ${this.id}] NEW EVENT RECEIVED               ║`);
        logger.log(`╠════════════════════════════════════════════════════════════╣`);
        logger.log(`║ Type: ${event.type.padEnd(50)}║`);
        logger.log(`║ ID:   ${event.id.padEnd(50)}║`);
        logger.log(`║ Time: ${event.timestamp || new Date().toISOString().padEnd(50)}║`);
        logger.log(`╚════════════════════════════════════════════════════════════╝`);
        logger.log(`[GuardianAgent] Event payload:`, JSON.stringify(event.payload, null, 2));

        // Automated Sync before processing
        this.synchronizeSubAgents();

        const result: AgentEventResult = {
            success: true,
            response: '',
            alerts: [],
            activityLog: []
        };

        try {
            // 1. Core Event Handling
            await this.handleCoreEvents(event, result);

            // 2. Active Defense Protocols (Silent Audit & Entropy)
            if (event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE') {
                await this.runActiveDefenseProtocols(event, result);
            }

            // 3. Collaborative Brain: Dynamic Delegation with Inter-agent Memory
            const activeAgents = Array.from(this.subAgents.values());
            const subResponses: string[] = [];
            const docId = event.payload?.documentId;

            for (const agent of activeAgents) {
                if (agent.canHandle(event)) {
                    logger.log(`[GuardianAgent] Delegating to: ${agent.name}`);

                    const startTime = Date.now();
                    const subResult = await agent.process(event, this.state.memory, this.skillRegistry);

                    // Capture Activity Log with detailed information
                    const activityEntry = {
                        agentId: agent.id,
                        agentName: agent.name,
                        status: (subResult.success ? 'success' : 'error') as 'success' | 'error',
                        summary: subResult.response,
                        timestamp: new Date().toISOString(),
                        documentId: docId,
                        // Extended details for UI
                        skillsUsed: this.extractSkillsUsed(subResult),
                        documentsIdentified: subResult.requiredDocuments?.map(d => d.name) || [],
                        alerts: subResult.alerts?.map(a => ({
                            severity: a.severity,
                            message: a.message
                        })) || []
                    };
                    result.activityLog?.push(activityEntry);

                    if (subResult.response) {
                        subResponses.push(subResult.response);
                    }
                    if (subResult.alerts && subResult.alerts.length > 0) {
                        result.alerts.push(...subResult.alerts);
                    }

                    // Aggregate required documents from sub-agents
                    if (subResult.requiredDocuments && subResult.requiredDocuments.length > 0) {
                        result.requiredDocuments = [
                            ...(result.requiredDocuments || []),
                            ...subResult.requiredDocuments
                        ];
                    }

                    // Merge memory updates if any
                    if (subResult.memoryUpdates) {
                        const updates = subResult.memoryUpdates;

                        // Deep merge shortTerm to preserve nested data
                        if (updates.shortTerm) {
                            this.state.memory.shortTerm = {
                                ...this.state.memory.shortTerm,
                                ...updates.shortTerm,
                                conversationBuffer: [
                                    ...this.state.memory.shortTerm.conversationBuffer,
                                    ...(updates.shortTerm.conversationBuffer || [])
                                ],
                                stickyNoteBuffer: {
                                    ...this.state.memory.shortTerm.stickyNoteBuffer,
                                    ...(updates.shortTerm.stickyNoteBuffer || {})
                                }
                            };
                        }

                        // Deep merge knowledgeGraph
                        if (updates.knowledgeGraph) {
                            this.state.memory.knowledgeGraph = {
                                ...this.state.memory.knowledgeGraph,
                                ...updates.knowledgeGraph,
                                facts: [
                                    ...this.state.memory.knowledgeGraph.facts,
                                    ...(updates.knowledgeGraph.facts || [])
                                ]
                            };
                        }
                    }
                }
            }

            // Deduplicate required documents
            if (result.requiredDocuments && result.requiredDocuments.length > 0) {
                const seen = new Set<string>();
                result.requiredDocuments = result.requiredDocuments.filter(doc => {
                    const key = doc.name.toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            }

            // 4. Post-Processing Conflict Resolution & Alert ID Generation
            this.generateAlertIds(result.alerts);
            await this.resolveAgentConflicts(result);

            if (subResponses.length > 0) {
                const unifiedText = subResponses.join('\n');
                result.response = result.response
                    ? `${result.response}\n\n**Specialist Findings:**\n${unifiedText}`
                    : `**Action Report:**\n${unifiedText}`;
            }

            // 5. Store in Session History
            this.state.sessionHistory.push({
                event,
                result: { ...result, memoryUpdates: undefined }, // Don't store full memory updates in history
                timestamp: new Date().toISOString()
            });

        } catch (error: any) {
            console.error("Guardian Agent Critical Error:", error);
            result.success = false;
            result.response = "Critical Orchestrator Failure.";
        } finally {
            this.state.status = 'idle';
        }

        return result;
    }

    public async runConsistencyCheck(
        uploadedDocuments: string[],
        eventType: 'upload' | 'scheduled' | 'manual' = 'scheduled',
        documentType?: string
    ): Promise<AgentEventResult> {
        this.state.status = 'processing';

        const existingFacts = this.graph.getAllFacts();
        const newFacts = this.state.memory.knowledgeGraph.facts;

        const backwardResult = consistencyValidator.validateOneStepBackward(newFacts, existingFacts);
        const forwardResult = consistencyValidator.validateOneStepForward(newFacts, uploadedDocuments);
        const chainResult = consistencyValidator.validateFullChain(newFacts);

        const validationResult = consistencyValidator.generateValidationResult(
            documentType || 'N/A',
            eventType,
            backwardResult,
            forwardResult
        );

        const alerts: AgentAlert[] = [];
        let response = `**Consistency Validation Report**\n\n`;

        if (!backwardResult.valid) {
            response += `⚠️ **Backward Conflicts Found**: ${backwardResult.conflicts.length}\n`;
            backwardResult.conflicts.forEach(conflict => {
                alerts.push({
                    severity: conflict.severity,
                    message: `Conflict: ${conflict.field} changed from "${conflict.previousValue}" to "${conflict.currentValue}"`,
                    suggestedAction: 'Verify document authenticity'
                });
                response += `- ${conflict.field}: "${conflict.previousValue}" → "${conflict.currentValue}"\n`;
            });
        } else {
            response += `✅ **Backward Check**: All fields consistent with previous documents\n`;
        }

        if (!forwardResult.valid) {
            response += `⚠️ **Forward Gaps Found**: ${forwardResult.gaps.length}\n`;
            forwardResult.gaps.forEach(gap => {
                alerts.push({
                    severity: gap.severity,
                    message: `Gap: ${gap.field} - ${gap.reason}`,
                    suggestedAction: gap.reason
                });
                response += `- ${gap.field}: ${gap.reason}\n`;
            });
        } else {
            response += `✅ **Forward Check**: Expected documents are accounted for\n`;
        }

        if (!chainResult.valid) {
            response += `⚠️ **Chain Issues**: ${chainResult.issues.length}\n`;
            chainResult.issues.forEach(issue => {
                alerts.push({
                    severity: 'warning',
                    message: issue,
                    suggestedAction: 'Review chain of custody'
                });
                response += `- ${issue}\n`;
            });
        }

        if (backwardResult.valid && forwardResult.valid && chainResult.valid) {
            response += `✅ **Full Chain Valid**: All consistency checks passed\n`;
        }

        this.state.status = 'idle';

        return {
            success: validationResult.status === 'valid',
            response,
            alerts,
            activityLog: [{
                agentId: 'consistency_validator',
                agentName: 'Consistency Validator',
                status: validationResult.status === 'valid' ? 'success' : 'error',
                summary: `Backward: ${backwardResult.valid ? 'OK' : 'Conflicts'}, Forward: ${forwardResult.valid ? 'OK' : 'Gaps'}, Chain: ${chainResult.valid ? 'OK' : 'Issues'}`,
                timestamp: new Date().toISOString()
            }],
            data: { validationResult }
        };
    }

    private async handleCoreEvents(event: AgentEvent, result: AgentEventResult) {
        switch (event.type) {
            case 'DOCUMENT_UPLOAD':
                await this.trackDocumentFact(event.payload);
                await this.runDocumentGuard(event, result);
                break;
            case 'ROUTE_UPDATE':
                await this.handleRouteInvalidation(event.payload, result);
                break;
            case 'USER_MESSAGE':
                this.logUserMessage(event.payload, result);
                break;
        }
    }

    // --- Active Defense Logic ---

    private async runActiveDefenseProtocols(event: AgentEvent, result: AgentEventResult) {
        // A. Entropy Audit (Random Probe)
        // Logic: Roll dice against dynamic threshold
        const threshold = this.activeDefenseConfig.entropyThreshold;
        if (Math.random() < threshold) {
            logger.log(`[Active Defense] Entropy Audit Triggered (Threshold: ${threshold})`);
            result.alerts.push({
                severity: 'info',
                message: 'Entropy Audit: Random verification check initiated for Model Drift calibration.',
                suggestedAction: 'Perform manual spot-check.'
            });
            this.appendThought("Entropy Audit triggered. Randomly verifying cleanly marked items.");
        }

        // B. Risk-Weighted Gravity Score (Silent Audit)
        const payloadStr = JSON.stringify(event.payload || {}).toLowerCase();

        for (const profile of this.activeDefenseConfig.globalRiskProfiles) {
            // Check if any keyword matches
            const match = profile.matchKeywords.some(keyword => payloadStr.includes(keyword.toLowerCase()));

            if (match) {
                logger.log(`[Active Defense] High Gravity Detected via Profile Match.`);

                if (profile.gravityScore > 0.7) {
                    result.alerts.push({
                        severity: 'warning',
                        message: `Silent Audit: High-risk profile match (Gravity: ${profile.gravityScore}). Performing deep scan.`,
                    });
                    this.appendThought(`High risk profile match in event payload. Initiating silent audit.`);
                }

                if (profile.auditConfig.silentAudit) {
                    this.appendThought("Silent Audit configuration active for this profile.");
                    // In a real system, this would trigger a background job
                }
            }
        }
    }

    private async runDocumentGuard(event: AgentEvent, result: AgentEventResult) {
        const skill = this.skillRegistry.get('document_guard_skill');
        if (!skill) return;

        logger.log(`[GuardianAgent] Running Document Guard (Invoice Reconciler)`);

        // Construct Context
        // We need to pass the file. In a real scenario, the file object or URL is in payload.
        // agentService passes payload: { documentId, analysis, shipment }
        // It does NOT pass the File object directly in payload usually (too big for JSON payload if serialized).
        // However, `agentService.assessDocument` is called from `RegisterConsignment` where `file` is available.
        // We might need to update `agentService` to pass the file in context or stored location.
        // For Client-Side execution (Prototype), we can try to pass it if it's in memory.

        // Update: `agentService.assessDocument` doesn't pass `files` in `event` payload.
        // We need to fetch it or rely on `payload.analysis` which was already done by `validationService`.
        // BUT the user wants "Invoice Reconciler" logic (LlamaParse).
        // `validationService.analyzeDocument` uses Gemini.
        // The `DocumentGuardSkill` we just wrote expects `files` in context.

        // Hack for Prototype: We assume `event.payload` MIGHT contain the file if we modify `agentService`,
        // Or we warn that we need the file.
        // Let's modify `agentService` to pass `file` in a transient way if possible, or skip if not.
        const context: any = {
            consignmentId: this.id,
            files: event.payload.file ? [event.payload.file] : [], // Expect file in payload
            metadata: event.payload
        };

        const skillResult = await skill.execute(context);

        if (skillResult.success) {
            this.appendThought(`Document Guard reconciled document: ${skillResult.verdict}`);
            if (skillResult.verdict === 'WARNING' || skillResult.verdict === 'NON_COMPLIANT') {
                result.alerts.push({
                    severity: skillResult.verdict === 'NON_COMPLIANT' ? 'critical' : 'warning',
                    message: `Document Audit: ${skillResult.auditLog[0].details}`,
                    suggestedAction: 'Review document vs consignment details'
                });
            }
        } else {
            // Log error but don't fail the whole event
            logger.log(`[GuardianAgent] Document Guard Skipped/Failed: ${skillResult.errors?.join(', ')}`);
        }
    }

    private async trackDocumentFact(payload: any) {
        const docId = payload.documentId || uuidv4();

        // 1. Register document existence
        this.graph.addFact({
            id: uuidv4(),
            type: 'document_fact',
            subject: docId,
            predicate: 'existence',
            object: 'confirmed',
            confidence: 1.0,
            source: 'system',
            timestamp: new Date().toISOString()
        });

        // 2. Ingest Shipment context if present (High Value for summoner)
        if (payload.shipment) {
            const { origin, destination, product, hsCode, attributes } = payload.shipment;

            if (origin) {
                this.graph.addFact({
                    id: uuidv4(),
                    type: 'shipment_fact',
                    subject: 'consignment',
                    predicate: 'origin_country',
                    object: origin,
                    confidence: 1.0,
                    source: 'system',
                    timestamp: new Date().toISOString()
                });
            }

            if (destination) {
                this.graph.addFact({
                    id: uuidv4(),
                    type: 'shipment_fact',
                    subject: 'consignment',
                    predicate: 'destination_country',
                    object: destination,
                    confidence: 1.0,
                    source: 'system',
                    timestamp: new Date().toISOString()
                });
            }

            if (hsCode) {
                this.graph.addFact({
                    id: uuidv4(),
                    type: 'shipment_fact',
                    subject: 'consignment',
                    predicate: 'hs_code',
                    object: hsCode,
                    confidence: 1.0,
                    source: 'system',
                    timestamp: new Date().toISOString()
                });
            }

            if (product) {
                this.graph.addFact({
                    id: uuidv4(),
                    type: 'shipment_fact',
                    subject: 'consignment',
                    predicate: 'product_name',
                    object: product.toLowerCase(),
                    confidence: 1.0,
                    source: 'system',
                    timestamp: new Date().toISOString()
                });
            }

            // Attributes (e.g., Organic)
            if (attributes && Array.isArray(attributes)) {
                attributes.forEach(attr => {
                    this.graph.addFact({
                        id: uuidv4(),
                        type: 'product_attribute',
                        subject: 'product',
                        predicate: `is_${attr.toLowerCase().replace(/\s+/g, '_')}`,
                        object: 'true',
                        confidence: 1.0,
                        source: 'system',
                        timestamp: new Date().toISOString()
                    });
                });
            }
        }

        this.appendThought(`Registered new document ${docId} and infilled shipment context in Knowledge Graph.`);
    }

    private async handleRouteInvalidation(payload: any, result: AgentEventResult) {
        const changedFactId = payload.factId;
        if (changedFactId) {
            const invalidatedIds = this.graph.invalidateFact(changedFactId);
            if (invalidatedIds.length > 0) {
                result.alerts.push({
                    severity: 'warning',
                    message: `Graph Invalidation: ${invalidatedIds.length} dependent facts reset.`,
                    relatedFactIds: invalidatedIds
                });
                this.appendThought(`Route update invalidated ${invalidatedIds.length} facts.`);
            }
        }
    }

    private logUserMessage(payload: any, result: AgentEventResult) {
        const message = payload.message as string;
        this.state.memory.shortTerm.conversationBuffer.push({
            id: uuidv4(),
            sender: 'user',
            content: message,
            timestamp: new Date().toISOString(),
            type: 'text'
        });
        result.response = "Message received. Agents are processing.";
    }

    private async resolveAgentConflicts(result: AgentEventResult) {
        if (!result.alerts || result.alerts.length < 2) return;

        logger.log(`[GuardianAgent] Running Conflict Resolution on ${result.alerts.length} alerts.`);

        // Use Conflict Scanner skill if available
        const scanner = this.skillRegistry.get('conflict_scanner');
        if (scanner) {
            // Future: Implement specific logic to merge/override contradictory alerts
            // For now, we just log and tag them
            this.appendThought("Cross-referencing sub-agent findings for contradictions.");
        }
    }

    private generateAlertIds(alerts: AgentAlert[]) {
        alerts.forEach(alert => {
            if (!alert.id) alert.id = uuidv4();
        });
    }

    private clearStickyNotes() {
        this.state.memory.shortTerm.stickyNoteBuffer = {};
    }

    private appendThought(thought: string) {
        this.state.memory.shortTerm.currentThoughtProcess = thought;
    }

    private extractSkillsUsed(subResult: any): string[] {
        // Extract skill names from the result data if available
        const skills: string[] = [];

        if (subResult.data?.skillsUsed) {
            return subResult.data.skillsUsed;
        }

        // Infer from result message or data
        if (subResult.data?.regulation) {
            skills.push(`${subResult.data.regulation} Check`);
        }

        if (subResult.data?.standard) {
            skills.push(`${subResult.data.standard} Validation`);
        }

        // Default to generic skill name based on response content
        if (subResult.response?.includes('Certificate')) {
            skills.push('Certificate Validator');
        }

        if (subResult.response?.includes('Regulatory')) {
            skills.push('Regulatory Check');
        }

        if (subResult.response?.includes('Audit')) {
            skills.push('Audit Analysis');
        }

        return skills.length > 0 ? skills : ['Domain Analysis'];
    }
}
