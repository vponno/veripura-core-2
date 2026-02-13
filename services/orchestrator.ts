import { consignmentService, Consignment } from './consignmentService';
import { GuardianAgentFactory, processPOUpload, processRouteUpdate, processUserMessage } from './agent/guardianAgentFactory';
import { AgentEventResult } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface POUploadContext {
    consignmentId: string;
    documentType: string;
    file: File;
    analysisResult: any;
}

export interface OrchestratorResult extends AgentEventResult {
    consignmentId: string;
    documentType: string;
    roadmapUpdates?: any;
    agentStateUpdates?: any;
}

export class GuardianOrchestrator {
    
    public static async handlePOUpload(
        context: POUploadContext
    ): Promise<OrchestratorResult> {
        const { consignmentId, documentType, analysisResult } = context;

        console.log(`[Orchestrator] Handling PO Upload for ${consignmentId}, doc: ${documentType}`);

        const consignment = await consignmentService.getConsignment(consignmentId);
        if (!consignment) {
            throw new Error(`Consignment not found: ${consignmentId}`);
        }

        const shipmentContext = {
            origin: consignment.exportFrom,
            destination: consignment.importTo,
            product: consignment.product || consignment.products?.[0]?.name,
            hsCode: consignment.hsCode || consignment.products?.[0]?.hsCode,
            attributes: consignment.products?.[0]?.attributes || []
        };

        let agentResult: AgentEventResult;

        try {
            agentResult = await processPOUpload(
                consignmentId,
                documentType,
                analysisResult,
                shipmentContext
            );
        } catch (error) {
            console.error(`[Orchestrator] Agent processing failed:`, error);
            agentResult = {
                success: false,
                response: 'Agent processing failed, falling back to basic analysis',
                alerts: [],
                activityLog: []
            };
        }

        const roadmapUpdates = this.computeRoadmapUpdates(
            documentType,
            analysisResult,
            agentResult
        );

        const agentStateUpdates = {
            lastActive: new Date().toISOString(),
            activityLog: agentResult.activityLog
        };

        return {
            ...agentResult,
            consignmentId,
            documentType,
            roadmapUpdates,
            agentStateUpdates
        };
    }

    public static async handleRouteUpdate(
        consignmentId: string,
        newOrigin: string,
        newDestination: string,
        changedFactId?: string
    ): Promise<OrchestratorResult> {
        console.log(`[Orchestrator] Handling Route Update for ${consignmentId}`);

        let agentResult: AgentEventResult;

        try {
            agentResult = await processRouteUpdate(
                consignmentId,
                newOrigin,
                newDestination,
                changedFactId
            );
        } catch (error) {
            console.error(`[Orchestrator] Route update agent processing failed:`, error);
            agentResult = {
                success: false,
                response: 'Route update processing failed',
                alerts: [],
                activityLog: []
            };
        }

        return {
            ...agentResult,
            consignmentId,
            documentType: 'ROUTE_UPDATE',
            roadmapUpdates: null,
            agentStateUpdates: {
                lastActive: new Date().toISOString()
            }
        };
    }

    public static async handleUserMessage(
        consignmentId: string,
        message: string
    ): Promise<OrchestratorResult> {
        console.log(`[Orchestrator] Handling User Message for ${consignmentId}`);

        let agentResult: AgentEventResult;

        try {
            agentResult = await processUserMessage(consignmentId, message);
        } catch (error) {
            console.error(`[Orchestrator] Message processing failed:`, error);
            agentResult = {
                success: false,
                response: 'Message processing failed',
                alerts: [],
                activityLog: []
            };
        }

        return {
            ...agentResult,
            consignmentId,
            documentType: 'USER_MESSAGE',
            roadmapUpdates: null,
            agentStateUpdates: {
                lastActive: new Date().toISOString()
            }
        };
    }

    private static computeRoadmapUpdates(
        documentType: string,
        analysisResult: any,
        agentResult: AgentEventResult
    ): any {
        const hasCriticalAlerts = agentResult.alerts.some(a => a.severity === 'critical');
        const hasWarnings = agentResult.alerts.some(a => a.severity === 'warning');

        let validationLevel = 'GREEN';
        let status = 'Validated';

        if (hasCriticalAlerts) {
            validationLevel = 'RED';
            status = 'Rejected';
        } else if (hasWarnings || analysisResult?.requiresHumanReview) {
            validationLevel = 'YELLOW';
            status = 'Pending Review';
        }

        const updates: any = {
            [documentType]: {
                status,
                validationLevel,
                analysis: {
                    ...analysisResult,
                    agentAuditTrail: agentResult.activityLog,
                    agentAlerts: agentResult.alerts,
                    processedAt: new Date().toISOString()
                }
            }
        };

        // Add required documents from Guardian Agent sub-agents
        if (agentResult.requiredDocuments && agentResult.requiredDocuments.length > 0) {
            console.log(`[Orchestrator] Adding ${agentResult.requiredDocuments.length} required documents from Guardian Agent`);
            
            agentResult.requiredDocuments.forEach(doc => {
                if (!updates[doc.name]) {
                    updates[doc.name] = {
                        required: true,
                        status: 'Pending',
                        description: doc.description,
                        agencyLink: doc.agencyLink,
                        category: doc.category,
                        reason: doc.reason || `Required by ${doc.agency || 'compliance specialist'}`,
                        addedBy: 'guardian_agent'
                    };
                }
            });
        }

        return updates;
    }

    public static async applyUpdates(
        consignmentId: string,
        updates: {
            roadmap?: any;
            agentState?: any;
            guardianAgent?: any;
        }
    ): Promise<void> {
        const updatePayload: any = {};

        if (updates.roadmap) {
            const current = await consignmentService.getConsignment(consignmentId);
            const currentRoadmap = current?.roadmap || {};
            updatePayload.roadmap = {
                ...currentRoadmap,
                ...updates.roadmap
            };
        }

        if (updates.agentState) {
            updatePayload.agentState = updates.agentState;
        }

        if (updates.guardianAgent) {
            updatePayload.guardianAgent = updates.guardianAgent;
        }

        await consignmentService.updateConsignment(consignmentId, updatePayload);
        console.log(`[Orchestrator] Applied updates for ${consignmentId}`);
    }
}

export const orchestratorService = {
    handlePOUpload: GuardianOrchestrator.handlePOUpload.bind(GuardianOrchestrator),
    handleRouteUpdate: GuardianOrchestrator.handleRouteUpdate.bind(GuardianOrchestrator),
    handleUserMessage: GuardianOrchestrator.handleUserMessage.bind(GuardianOrchestrator),
    applyUpdates: GuardianOrchestrator.applyUpdates.bind(GuardianOrchestrator)
};
