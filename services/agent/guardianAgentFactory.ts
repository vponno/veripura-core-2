import { AgentState, AgentEvent, AgentEventResult } from '../../types';
import { GuardianAgent } from './guardianAgent';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logger } from '../lib/logger';

export interface AgentInstanceConfig {
    consignmentId: string;
    initialState?: AgentState;
    riskConfig?: any;
}

export class GuardianAgentFactory {
    private static instances: Map<string, GuardianAgent> = new Map();
    private static readonly STATE_COLLECTION = 'guardian_agent_states';

    public static async spawn(config: AgentInstanceConfig): Promise<GuardianAgent> {
        const { consignmentId, initialState, riskConfig } = config;

        if (this.instances.has(consignmentId)) {
            logger.log(`[GuardianAgentFactory] Returning existing instance for ${consignmentId}`);
            return this.instances.get(consignmentId)!;
        }

        logger.log(`[GuardianAgentFactory] Spawning new GuardianAgent for consignment: ${consignmentId}`);

        const agent = new GuardianAgent(
            `guardian-${consignmentId}`,
            initialState,
            riskConfig
        );

        this.instances.set(consignmentId, agent);
        return agent;
    }

    public static get(consignmentId: string): GuardianAgent | undefined {
        return this.instances.get(consignmentId);
    }

    public static has(consignmentId: string): boolean {
        return this.instances.has(consignmentId);
    }

    public static async hydrate(consignmentId: string): Promise<GuardianAgent | null> {
        try {
            const stateDoc = await getDoc(doc(db, this.STATE_COLLECTION, consignmentId));
            
            if (stateDoc.exists()) {
                const savedState = stateDoc.data() as { state: AgentState; updatedAt: string };
                logger.log(`[GuardianAgentFactory] Hydrating agent state for ${consignmentId}`);
                return this.spawn({ consignmentId, initialState: savedState.state });
            }

            logger.log(`[GuardianAgentFactory] No saved state for ${consignmentId}, creating new`);
            return this.spawn({ consignmentId });
        } catch (error) {
            console.error(`[GuardianAgentFactory] Failed to hydrate:`, error);
            return this.spawn({ consignmentId });
        }
    }

    public static async persist(consignmentId: string): Promise<void> {
        const agent = this.instances.get(consignmentId);
        if (!agent) {
            console.warn(`[GuardianAgentFactory] No instance to persist for ${consignmentId}`);
            return;
        }

        const state = agent.getState();
        
        try {
            await setDoc(doc(db, this.STATE_COLLECTION, consignmentId), {
                state,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            logger.log(`[GuardianAgentFactory] Persisted state for ${consignmentId}`);
        } catch (error) {
            console.error(`[GuardianAgentFactory] Failed to persist:`, error);
        }
    }

    public static async processEvent(
        consignmentId: string,
        event: AgentEvent
    ): Promise<AgentEventResult> {
        let agent = this.get(consignmentId);
        
        if (!agent) {
            agent = await this.hydrate(consignmentId);
        }

        if (!agent) {
            throw new Error(`Failed to create agent for ${consignmentId}`);
        }

        const result = await agent.processEvent(event);

        await this.persist(consignmentId);

        return result;
    }

    public static destroy(consignmentId: string): void {
        if (this.instances.has(consignmentId)) {
            this.instances.delete(consignmentId);
            logger.log(`[GuardianAgentFactory] Destroyed instance for ${consignmentId}`);
        }
    }

    public static destroyAll(): void {
        this.instances.clear();
        logger.log(`[GuardianAgentFactory] Destroyed all instances`);
    }
}

export async function processPOUpload(
    consignmentId: string,
    documentType: string,
    analysisResult: any,
    shipmentContext: {
        origin: string;
        destination: string;
        product?: string;
        hsCode?: string;
        attributes?: string[];
    }
): Promise<AgentEventResult> {
    const event: AgentEvent = {
        id: `evt-${Date.now()}`,
        type: 'DOCUMENT_UPLOAD',
        payload: {
            documentId: documentType,
            analysis: analysisResult,
            shipment: shipmentContext
        },
        timestamp: new Date().toISOString()
    };

    return GuardianAgentFactory.processEvent(consignmentId, event);
}

export async function processRouteUpdate(
    consignmentId: string,
    newOrigin: string,
    newDestination: string,
    changedFactId?: string
): Promise<AgentEventResult> {
    const event: AgentEvent = {
        id: `evt-${Date.now()}`,
        type: 'ROUTE_UPDATE',
        payload: {
            origin: newOrigin,
            destination: newDestination,
            factId: changedFactId
        },
        timestamp: new Date().toISOString()
    };

    return GuardianAgentFactory.processEvent(consignmentId, event);
}

export async function processUserMessage(
    consignmentId: string,
    message: string
): Promise<AgentEventResult> {
    const event: AgentEvent = {
        id: `evt-${Date.now()}`,
        type: 'USER_MESSAGE',
        payload: {
            message
        },
        timestamp: new Date().toISOString()
    };

    return GuardianAgentFactory.processEvent(consignmentId, event);
}
