import { AgentEvent, AgentEventResult, AgentMemory } from '../../types';
import { SkillRegistry } from './skills/skillRegistry';

export interface SubAgentMetadata {
    id: string;
    name: string;
    description: string;
}

export abstract class SubAgent {
    public id: string;
    public name: string;
    public description: string;

    constructor(id: string, name: string, description: string) {
        this.id = id;
        this.name = name;
        this.description = description;
    }

    /**
     * Determines if this agent should be active for the given context.
     * This moves the "Summoning" logic from the Factory to the Agent itself.
     * @param context The simplified context object (destination, product, etc.)
     */
    public static shouldActivate(context: any): boolean {
        return false; // Default to false, concrete classes must override if they have specific triggers
    }

    /**
     * Checks if the agent can handle a specific event.
     * Use this for granular event filtering *after* the agent is active.
     */
    abstract canHandle(event: AgentEvent): boolean;

    /**
     * Processes the event.
     */
    abstract process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult>;
}
