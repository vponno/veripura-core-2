import { AgentEvent, AgentEventResult, AgentMemory } from '../../types';
import { SkillRegistry } from './skills/skillRegistry';
import { GoogleGenAI } from "@google/genai";

export interface SubAgentMetadata {
    id: string;
    name: string;
    description: string;
}

// Initialize AI - get API key from environment
const getApiKey = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.VITE_GEMINI_API_KEY || (window as any).ENV?.VITE_GEMINI_API_KEY;
    }
    return (window as any).ENV?.VITE_GEMINI_API_KEY || 'demo-key';
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * AI-driven Agent Activation System
 * Replaces hardcoded shouldActivate() logic with intelligent AI-based decision making.
 */
export const AgentActivator = {
    /**
     * Determines if an agent should activate based on its description and the trade context.
     * This makes agent activation 100% agentic - no hardcoded country/product checks.
     */
    async shouldActivate(agentName: string, agentDescription: string, context: any): Promise<boolean> {
        const prompt = `
You are an expert in international trade compliance.
Given a Guardian Agent's specialization and the current trade context, determine if this agent should be activated.

Agent: "${agentName}"
Specialization: "${agentDescription}"

Trade Context:
- Origin: ${context.origin || 'Unknown'}
- Destination: ${context.destination || 'Unknown'}
- Product: ${context.product || 'Unknown'}
- HS Code: ${context.hsCode || 'Unknown'}
- Document Type: ${context.documentType || 'N/A'}

Respond with ONLY "true" if this agent should analyze this shipment, or "false" if it's not relevant.
`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: { role: 'user', parts: [{ text: prompt }] }
            });
            const result = response.text?.toLowerCase().trim();
            const shouldActivate = result === 'true';
            console.log(`[AgentActivator] ${agentName}: ${shouldActivate} (AI decision)`);
            return shouldActivate;
        } catch (error) {
            console.warn(`[AgentActivator] AI decision failed for ${agentName}, defaulting to true:`, error);
            return true;
        }
    }
};

/**
 * Fallback activation logic that's dynamic but not hardcoded to specific countries.
 * Uses keyword matching on agent descriptions rather than hardcoded country checks.
 */
export const DynamicActivator = {
    shouldActivate(agentName: string, agentDescription: string, context: any): boolean {
        const dest = (context.destination || '').toLowerCase();
        const origin = (context.origin || '').toLowerCase();
        const product = (context.product || '').toLowerCase();
        const docType = (context.documentType || '').toLowerCase();
        const description = agentDescription.toLowerCase();
        
        // EUDR - matches any EU-related keywords in description
        if (description.includes('deforestation') || description.includes('eudr') || description.includes('eu dr')) {
            return dest.includes('eu') || dest.includes('europe') || docType.includes('deforestation');
        }
        
        // FSMA - USA food safety
        if (description.includes('fsma') || description.includes('usa') || description.includes('fda')) {
            return dest.includes('usa') || dest.includes('us') || dest.includes('united states');
        }
        
        // Organic
        if (description.includes('organic')) {
            return product.includes('organic') || product.includes('bio') || docType.includes('organic');
        }
        
        // Halal/Kosher
        if (description.includes('halal') || description.includes('kosher') || description.includes('religious')) {
            return docType.includes('halal') || docType.includes('kosher') || product.includes('meat') || product.includes('beef') || product.includes('chicken');
        }
        
        // Fishery
        if (description.includes('fishery') || description.includes('iuu') || description.includes('fish')) {
            return product.includes('fish') || product.includes('seafood') || product.includes('shrimp');
        }
        
        // Phytosanitary/Health
        if (description.includes('phytosanitary') || description.includes('sps') || description.includes('plant health')) {
            return product.includes('plant') || product.includes('vegetable') || product.includes('fruit') || docType.includes('phytosanitary');
        }
        
        // Cold Chain
        if (description.includes('cold chain') || description.includes('temperature')) {
            return docType.includes('cold') || docType.includes('frozen') || docType.includes('refrigerat');
        }
        
        // Default: activate for broad relevance
        return true;
    }
};

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
