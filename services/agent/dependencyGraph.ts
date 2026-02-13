import { KnowledgeFact, KnowledgeRelationship } from '../../types';

export class DependencyGraph {
    private facts: Map<string, KnowledgeFact>;
    private relationships: KnowledgeRelationship[];

    constructor(facts: KnowledgeFact[] = [], relationships: KnowledgeRelationship[] = []) {
        this.facts = new Map(facts.map(f => [f.id, f]));
        this.relationships = relationships;
    }

    /**
     * Adds or updates a fact in the graph.
     */
    public addFact(fact: KnowledgeFact): void {
        this.facts.set(fact.id, fact);
    }

    /**
     * Adds a relationship to the graph.
     */
    public addRelationship(relationship: KnowledgeRelationship): void {
        // Check if relationships already exists to avoid duplicates? 
        // For now, just push. In prod, we'd enable a Set or check.
        this.relationships.push(relationship);
    }

    /**
     * Retrieves a fact by ID.
     */
    public getFact(id: string): KnowledgeFact | undefined {
        return this.facts.get(id);
    }

    /**
     * Retrieves all facts.
     */
    public getAllFacts(): KnowledgeFact[] {
        return Array.from(this.facts.values());
    }

    /**
     * Retrieves all relationships.
     */
    public getAllRelationships(): KnowledgeRelationship[] {
        return this.relationships;
    }

    /**
     * Invalidates a fact and recursively identifies all affected downstream facts.
     * Returns a list of all fact IDs that were invalidated.
     */
    public invalidateFact(factId: string): string[] {
        const invalidatedIds = new Set<string>();
        const queue = [factId];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (invalidatedIds.has(currentId)) continue;

            invalidatedIds.add(currentId);

            // Find direct dependents:
            // If A 'depends_on' B (A -> B), and B is invalidated (currentId), then A is affected.
            // So we look for relationships where toFactId == currentId AND type == 'depends_on'.

            // If A 'validates' B (A -> B), and A is invalidated (currentId), then B is valid-less?
            // Yes, if the validation (A) is busted, B is questionable.
            // So we look for relationships where fromFactId == currentId AND type == 'validates'. Wait.

            // Let's standardize:
            // "depends_on": A depends on B. B changes -> A changes. (Upstream change affects downstream)
            // "validates": A validates B. A changes -> B status changes.

            // Case 1: Dependents (Downstream)
            // Rel: [From: A] --depends_on--> [To: B]
            // If B (currentId) is invalidated, find all A's.
            const dependents = this.relationships
                .filter(r => r.toFactId === currentId && r.relationshipType === 'depends_on')
                .map(r => r.fromFactId);

            // Case 2: Validation Targets (When validator fails)
            // Rel: [From: A] --validates--> [To: B]
            // If A (currentId) is invalidated, B loses validation.
            const validationTargets = this.relationships
                .filter(r => r.fromFactId === currentId && r.relationshipType === 'validates')
                .map(r => r.toFactId);

            // Add to queue
            [...dependents, ...validationTargets].forEach(id => {
                if (!invalidatedIds.has(id)) {
                    queue.push(id);
                }
            });
        }

        // Remove the initial invalidation trigger if we only want *affected* nodes, 
        // but usually we want to know the whole set including the trigger. 
        // We will return everything.
        return Array.from(invalidatedIds);
    }

    /**
     * Identifies facts that conflict with a new fact.
     * A conflict occurs if two facts have the same subject and predicate but different objects.
     */
    public detectConflicts(newFact: KnowledgeFact): KnowledgeFact[] {
        return Array.from(this.facts.values()).filter(existingFact =>
            existingFact.subject === newFact.subject &&
            existingFact.predicate === newFact.predicate &&
            existingFact.object !== newFact.object &&
            existingFact.id !== newFact.id
        );
    }

    /**
     * Serializes the graph for storage.
     */
    public serialize() {
        return {
            facts: Array.from(this.facts.values()),
            relationships: this.relationships,
            version: 1
        };
    }

    /**
     * Hydrates the graph from storage.
     */
    public static deserialize(data: { facts: KnowledgeFact[], relationships: KnowledgeRelationship[] }): DependencyGraph {
        return new DependencyGraph(data.facts, data.relationships);
    }
}
