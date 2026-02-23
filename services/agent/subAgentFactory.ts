import { SubAgent } from './subAgent';
import * as SubAgents from './subagents';

export class SubAgentFactory {
    private static agentMap: Map<string, any> | null = null;
    private static agentClasses: any[] = [];

    /**
     * Initializes the agent map and class list once.
     */
    private static initialize() {
        if (this.agentMap) return;

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [SubAgentFactory] Initializing...                        ║');
        console.log('╚════════════════════════════════════════════════════════════╝');

        this.agentMap = new Map();
        this.agentClasses = Object.values(SubAgents);

        console.log('[SubAgentFactory] Discovered sub-agent classes:', this.agentClasses.length);
        
        // Pre-map IDs to Classes for fast lookup in create()
        for (const AgentClass of this.agentClasses) {
            try {
                // We instantiate once to get the ID. 
                // This assumes constructors are lightweight/side-effect free, which they are.
                const tempInstance = new AgentClass();
                if (tempInstance instanceof SubAgent) {
                    this.agentMap.set(tempInstance.id, AgentClass);
                    console.log(`[SubAgentFactory] ✓ Registered: ${tempInstance.id} (${tempInstance.name})`);
                }
            } catch (e) {
                console.warn(`[SubAgentFactory] ✗ Failed to register agent class: ${AgentClass?.name}`, e);
            }
        }
        
        console.log(`[SubAgentFactory] Initialization complete. Total registered: ${this.agentMap.size}`);
    }

    /**
     * Creates a new instance of a sub-agent by its ID.
     * Uses the dynamic registry instead of a hardcoded switch statement.
     * @param id The ID of the sub-agent to create (e.g., 'eudr_specialist')
     */
    public static create(id: string): SubAgent | null {
        this.initialize();

        const AgentClass = this.agentMap?.get(id);
        if (AgentClass) {
            console.log(`[SubAgentFactory] Creating sub-agent: ${id}`);
            return new AgentClass();
        }

        console.warn(`[SubAgentFactory] ⚠️ Unknown agent ID: ${id}`);
        console.log(`[SubAgentFactory] Available agents:`, Array.from(this.agentMap?.keys() || []));
        return null;
    }

    /**
     * Determines which sub-agents are required based on the shipment context.
     * Iterates through all registered agents and queries their static `shouldActivate` method.
     * @param context The simplified context object (destination, product, etc.)
     */
    public static getRequiredSubAgents(context: any): string[] {
        this.initialize();

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║ [SubAgentFactory] Determining required sub-agents       ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║ Context:`, JSON.stringify(context).substring(0, 40) + '...');
        console.log('╚════════════════════════════════════════════════════════════╝');

        const required: string[] = [];
        const activationResults: { id: string; name: string; activated: boolean; reason?: string }[] = [];

        for (const AgentClass of this.agentClasses) {
            // Check if the class has the static shouldActivate method
            if (typeof (AgentClass as any).shouldActivate === 'function') {
                try {
                    const shouldRun = (AgentClass as any).shouldActivate(context);
                    
                    // Get a temp instance for logging
                    let tempInstance: any;
                    try {
                        tempInstance = new AgentClass();
                    } catch (e) {
                        tempInstance = { id: AgentClass.name, name: AgentClass.name };
                    }
                    
                    activationResults.push({
                        id: tempInstance.id,
                        name: tempInstance.name,
                        activated: shouldRun,
                        reason: shouldRun ? 'Context match' : 'No match'
                    });
                    
                    if (shouldRun) {
                        // We need the ID. We can either instantiate or look it up.
                        // Since we already mapped IDs to Classes, we can reverse look up OR just instantiate.
                        // Instantiating is safest and robust.
                        const instance = new AgentClass();
                        required.push(instance.id);
                    }
                } catch (e) {
                    console.error(`[SubAgentFactory] ✗ Error checking activation for ${AgentClass.name}:`, e);
                }
            }
        }

        // Log activation results
        console.log('[SubAgentFactory] Sub-agent activation summary:');
        activationResults.forEach(r => {
            if (r.activated) {
                console.log(`[SubAgentFactory]   ✓ ${r.id} (${r.name}) - ACTIVATED`);
            }
        });
        
        // Log what was NOT activated
        const notActivated = activationResults.filter(r => !r.activated);
        if (notActivated.length > 0) {
            console.log(`[SubAgentFactory]   (${notActivated.length} agents not activated)`);
        }

        console.log(`[SubAgentFactory] → Required sub-agents: ${required.join(', ') || '(none)'}`);
        
        // Return unique IDs
        return [...new Set(required)];
    }
}
