import { consignmentService, Consignment } from './consignmentService';
import { GuardianAgentFactory, processPOUpload, processRouteUpdate, processUserMessage } from './agent/guardianAgentFactory';
import { AgentEventResult } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './lib/logger';

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
        const { consignmentId, documentType, analysisResult, file } = context;

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [Orchestrator] 📤 PO UPLOAD STARTED                     ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║ Consignment: ${consignmentId}`);
        console.log(`║ Document:   ${documentType}`);
        console.log(`║ File:       ${file?.name || 'N/A'} (${file?.size || 0} bytes)`);
        console.log(`║ Time:       ${new Date().toISOString()}`);
        console.log('╚════════════════════════════════════════════════════════════╝');

        const consignment = await consignmentService.getConsignment(consignmentId);
        if (!consignment) {
            console.error(`[Orchestrator] ❌ Consignment not found: ${consignmentId}`);
            throw new Error(`Consignment not found: ${consignmentId}`);
        }

        console.log('[Orchestrator] ✓ Consignment found');
        console.log('[Orchestrator] Consignment details:', {
            origin: consignment.exportFrom,
            destination: consignment.importTo,
            product: consignment.product || consignment.products?.[0]?.name,
            hsCode: consignment.hsCode || consignment.products?.[0]?.hsCode,
        });

        const shipmentContext = {
            origin: consignment.exportFrom,
            destination: consignment.importTo,
            product: consignment.product || consignment.products?.[0]?.name,
            hsCode: consignment.hsCode || consignment.products?.[0]?.hsCode,
            attributes: consignment.products?.[0]?.attributes || []
        };

        console.log('[Orchestrator] → Passing to Guardian Agent...');

        let agentResult: AgentEventResult;

        try {
            console.log('[Orchestrator] Awaiting Guardian Agent response...');
            agentResult = await processPOUpload(
                consignmentId,
                documentType,
                analysisResult,
                shipmentContext
            );
            console.log('[Orchestrator] ✓ Guardian Agent processing complete');
        } catch (error) {
            console.error('╔════════════════════════════════════════════════════════════╗');
            console.error('║ [Orchestrator] ❌ AGENT PROCESSING FAILED                ║');
            console.error('╚════════════════════════════════════════════════════════════╝');
            console.error(error);
            agentResult = {
                success: false,
                response: 'Agent processing failed, falling back to basic analysis',
                alerts: [],
                activityLog: []
            };
        }

        console.log('[Orchestrator] Computing roadmap updates...');
        const roadmapUpdates = this.computeRoadmapUpdates(
            documentType,
            analysisResult,
            agentResult
        );

        const agentStateUpdates = {
            lastActive: new Date().toISOString(),
            activityLog: agentResult.activityLog
        };

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [Orchestrator] ✅ PO UPLOAD COMPLETE                     ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║ Success:      ${agentResult.success}`);
        console.log(`║ Alerts:       ${agentResult.alerts?.length || 0}`);
        console.log(`║ Activity:     ${agentResult.activityLog?.length || 0} entries`);
        console.log(`║ Required Doc: ${agentResult.requiredDocuments?.length || 0}`);
        console.log('╚════════════════════════════════════════════════════════════╝');

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
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [Orchestrator] 🔄 ROUTE UPDATE STARTED                   ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║ Consignment:  ${consignmentId}`);
        console.log(`║ New Origin:   ${newOrigin}`);
        console.log(`║ New Dest:     ${newDestination}`);
        console.log(`║ Fact Changed: ${changedFactId || 'N/A'}`);
        console.log('╚════════════════════════════════════════════════════════════╝');

        let agentResult: AgentEventResult;

        try {
            agentResult = await processRouteUpdate(
                consignmentId,
                newOrigin,
                newDestination,
                changedFactId
            );
            console.log('[Orchestrator] ✓ Route update processed');
        } catch (error) {
            console.error('╔════════════════════════════════════════════════════════════╗');
            console.error('║ [Orchestrator] ❌ ROUTE UPDATE FAILED                   ║');
            console.error('╚════════════════════════════════════════════════════════════╝');
            console.error(error);
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
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [Orchestrator] 💬 USER MESSAGE RECEIVED                 ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║ Consignment: ${consignmentId}`);
        console.log(`║ Message:    "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
        console.log('╚════════════════════════════════════════════════════════════╝');

        let agentResult: AgentEventResult;

        try {
            agentResult = await processUserMessage(consignmentId, message);
            console.log('[Orchestrator] ✓ Message processed');
        } catch (error) {
            console.error('╔════════════════════════════════════════════════════════════╗');
            console.error('║ [Orchestrator] ❌ MESSAGE PROCESSING FAILED              ║');
            console.error('╚════════════════════════════════════════════════════════════╝');
            console.error(error);
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
        const hasCriticalAlerts = agentResult.alerts?.some(a => a.severity === 'critical');
        const hasWarnings = agentResult.alerts?.some(a => a.severity === 'warning');

        let validationLevel = 'GREEN';
        let status = 'Validated';

        if (hasCriticalAlerts) {
            validationLevel = 'RED';
            status = 'Rejected';
        } else if (hasWarnings || analysisResult?.requiresHumanReview) {
            validationLevel = 'YELLOW';
            status = 'Pending Review';
        }

        console.log('[Orchestrator] Validation result:', { validationLevel, status });

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
            console.log(`[Orchestrator] 📄 Adding ${agentResult.requiredDocuments.length} required documents:`);
            
            agentResult.requiredDocuments.forEach(doc => {
                console.log(`[Orchestrator]   + ${doc.name}: ${doc.description || doc.reason}`);
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
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [Orchestrator] 💾 APPLYING DATABASE UPDATES               ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║ Consignment: ${consignmentId}`);
        console.log(`║ Roadmap:    ${updates.roadmap ? 'Yes' : 'No'}`);
        console.log(`║ AgentState: ${updates.agentState ? 'Yes' : 'No'}`);
        console.log(`║ Guardian:   ${updates.guardianAgent ? 'Yes' : 'No'}`);
        console.log('╚════════════════════════════════════════════════════════════╝');

        const updatePayload: any = {};

        if (updates.roadmap) {
            const current = await consignmentService.getConsignment(consignmentId);
            const currentRoadmap = current?.roadmap || {};
            updatePayload.roadmap = {
                ...currentRoadmap,
                ...updates.roadmap
            };
            console.log('[Orchestrator] ✓ Roadmap merged');
        }

        if (updates.agentState) {
            updatePayload.agentState = updates.agentState;
            console.log('[Orchestrator] ✓ Agent state updated');
        }

        if (updates.guardianAgent) {
            updatePayload.guardianAgent = updates.guardianAgent;
            console.log('[Orchestrator] ✓ Guardian Agent state updated');
        }

        await consignmentService.updateConsignment(consignmentId, updatePayload);
        
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [Orchestrator] ✅ DATABASE UPDATES COMPLETE              ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
    }
}

export const orchestratorService = {
    handlePOUpload: GuardianOrchestrator.handlePOUpload.bind(GuardianOrchestrator),
    handleRouteUpdate: GuardianOrchestrator.handleRouteUpdate.bind(GuardianOrchestrator),
    handleUserMessage: GuardianOrchestrator.handleUserMessage.bind(GuardianOrchestrator),
    applyUpdates: GuardianOrchestrator.applyUpdates.bind(GuardianOrchestrator)
};
