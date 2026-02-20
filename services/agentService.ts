import { Consignment, AgentMessage, consignmentService } from './consignmentService';
import { v4 as uuidv4 } from 'uuid';
import { GuardianAgent } from './agent/guardianAgent';
import { AgentEvent } from '../types';
import { logger } from './lib/logger';

// Singleton instance for the UI session
let guardianAgentInstance: GuardianAgent | null = null;

const getGuardianAgent = () => {
    if (!guardianAgentInstance) {
        guardianAgentInstance = new GuardianAgent('consignment-guardian-1');
    }
    return guardianAgentInstance;
};

export const agentService = {
    // 1. Send a message locally and persist to DB
    sendMessage: async (consignmentId: string, content: string, type: 'text' | 'alert' | 'success' = 'text', sender: 'user' | 'agent' = 'agent') => {
        const message: AgentMessage = {
            id: uuidv4(),
            sender,
            content,
            timestamp: new Date().toISOString(),
            type
        };

        const consignment = await consignmentService.getConsignment(consignmentId);
        if (!consignment) return;

        const currentMessages = consignment.agentState?.messages || [];
        const newMessages = [...currentMessages, message];

        await consignmentService.updateConsignment(consignmentId, {
            agentState: {
                messages: newMessages,
                unreadCount: (consignment.agentState?.unreadCount || 0) + 1,
                lastActive: new Date().toISOString()
            }
        });

        return message;
    },

    // 2. Assess a new document against Ground Truth using the Collaborative Brain
    assessDocument: async (consignmentId: string, docType: string, newDocAnalysis: any, consignment?: Consignment, file?: File) => {
        const activeConsignment = consignment || await consignmentService.getConsignment(consignmentId);
        if (!activeConsignment) return;

        // Use a static ID for the session's guardian
        const agent = getGuardianAgent();

        // 1. Construct Event
        const event: AgentEvent = {
            id: uuidv4(),
            type: 'DOCUMENT_UPLOAD',
            payload: {
                documentId: docType, // Using docType as ID for roadmap lookup
                analysis: newDocAnalysis,
                file: file, // Pass file object for skills that need raw access (e.g. DocumentGuard)
                shipment: {
                    origin: activeConsignment.exportFrom,
                    destination: activeConsignment.importTo,
                    product: activeConsignment.product || activeConsignment.products?.[0]?.name,
                    hsCode: activeConsignment.hsCode || activeConsignment.products?.[0]?.hsCode,
                    attributes: activeConsignment.products?.[0]?.attributes || []
                }
            },
            timestamp: new Date().toISOString()
        };

        // 2. Process via Guardian Agent
        const result = await agent.processEvent(event);

        // 3. Compute Updates (Don't persist yet to allow atomicity in caller)
        const updatedRoadmap = { ...activeConsignment.roadmap };
        const currentGlobalLog = activeConsignment.agentState?.activityLog || [];
        const newGlobalLog = [...currentGlobalLog, ...(result.activityLog || [])].slice(-50); // Keep last 50 for performance

        if (updatedRoadmap[docType]) {
            updatedRoadmap[docType] = {
                ...updatedRoadmap[docType],
                analysis: {
                    ...updatedRoadmap[docType].analysis,
                    agentAuditTrail: result.activityLog // Store the specialists' findings for this specific doc
                }
            };
        }

        const agentStateUpdate = {
            ...activeConsignment.agentState,
            activityLog: newGlobalLog,
            lastActive: new Date().toISOString()
        };

        // 5. RLHF Trigger: If High Severity / Low Confidence, queue for review
        if (result.alerts?.some(a => a.severity === 'critical' || a.severity === 'warning')) {
            const highRiskAlert = result.alerts?.find(a => a.severity === 'critical') || result.alerts?.[0];
            try {
                // Dynamic import to avoid circular dependencies if any
                const { rlhfService } = await import('./rlhfService');
                const fileUrl = activeConsignment.roadmap[docType]?.fileUrl;

                await rlhfService.createReviewCase(
                    consignmentId,
                    docType,
                    highRiskAlert,
                    newDocAnalysis,
                    fileUrl
                );
                logger.log(`[GuardianAgent] Triggered RLHF Review for ${docType}`);
            } catch (e) {
                console.error("Failed to trigger RLHF:", e);
            }
        }

        // 6. Return result and updates
        return {
            result,
            updates: {
                roadmap: updatedRoadmap,
                agentState: agentStateUpdate
            }
        };
    }

};
