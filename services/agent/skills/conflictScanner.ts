import { Skill, SkillResult } from './skillRegistry';
import { KnowledgeFact, AgentMemory } from '../../../types';
import { DependencyGraph } from '../dependencyGraph';

export interface ConflictScannerInput {
    newFacts: KnowledgeFact[];
    memory: AgentMemory;
}

export interface ConflictScannerResult {
    conflictsFound: { existing: KnowledgeFact, incoming: KnowledgeFact }[];
    isConsistent: boolean;
}

export class ConflictScannerSkill implements Skill {
    id = 'conflict_scanner';
    name = 'Consistency Conflict Scanner';
    description = 'Executes the "One Step Forward, One Step Backward" check against the Knowledge Graph.';

    async execute(input: ConflictScannerInput): Promise<SkillResult> {
        const { newFacts, memory } = input;

        // Deserialize graph to use the detectConflicts helper
        const graph = DependencyGraph.deserialize(memory.knowledgeGraph);
        const conflictsFound: { existing: KnowledgeFact, incoming: KnowledgeFact }[] = [];

        for (const incoming of newFacts) {
            const conflicts = graph.detectConflicts(incoming);
            conflicts.forEach(existing => {
                conflictsFound.push({ existing, incoming });
            });
        }

        return {
            success: conflictsFound.length === 0,
            status: conflictsFound.length === 0 ? 'Clean' : 'Conflict',
            message: conflictsFound.length === 0 ? 'No conflicts found.' : `${conflictsFound.length} conflicts detected.`,
            score: conflictsFound.length === 0 ? 1.0 : 0,
            data: {
                conflictsFound: conflictsFound.length > 0,
                details: conflictsFound
            }
        };
    }
}
