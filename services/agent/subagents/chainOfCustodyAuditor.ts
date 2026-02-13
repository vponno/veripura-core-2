import { SubAgent } from '../subAgent';
import { AgentEvent, AgentEventResult, AgentMemory, AgentAlert, KnowledgeFact } from '../../../types';
import { SkillRegistry } from '../skills/skillRegistry';
import { v4 as uuidv4 } from 'uuid';
import { consistencyValidator, ChainValidationResult } from '../consistencyValidator';

export class ChainOfCustodyAuditor extends SubAgent {
    constructor() {
        super(
            'chain_of_custody_auditor',
            'Chain of Custody Auditor',
            'Ensures consistency between documents using the "One Step Forward, One Step Backward" principle.'
        );
    }

    public static shouldActivate(context: any): boolean {
        return true;
    }

    canHandle(event: AgentEvent): boolean {
        // Consistency audit should run on every document upload or manual data change
        return event.type === 'DOCUMENT_UPLOAD' || event.type === 'ROUTE_UPDATE' || event.type === 'HUMAN_DECISION';
    }

    async process(event: AgentEvent, context: AgentMemory, skills?: SkillRegistry): Promise<AgentEventResult> {
        const alerts: AgentAlert[] = [];
        let response = "**Chain of Custody Report: Consistency Audit**\n\n";

        const newFacts: KnowledgeFact[] = event.payload?.extractedFacts || [];
        const existingFacts = context.knowledgeGraph.facts || [];
        
        if (newFacts.length === 0 && existingFacts.length === 0) {
            return { 
                success: true, 
                response: "No facts available for consistency audit.", 
                alerts: [] 
            };
        }

        const backwardResult = consistencyValidator.validateOneStepBackward(newFacts, existingFacts);
        const forwardResult = consistencyValidator.validateOneStepForward(existingFacts, Object.keys(event.payload?.roadmap || {}));
        const chainResult = consistencyValidator.validateFullChain(existingFacts);

        const validationResult = consistencyValidator.generateValidationResult(
            event.payload?.documentId || 'N/A',
            event.type === 'DOCUMENT_UPLOAD' ? 'upload' : 'manual',
            backwardResult,
            forwardResult
        );

        if (!backwardResult.valid) {
            response += "⚠️ **CRITICAL CONSISTENCY MISMATCH DETECTED**\n";
            response += "The 'One Step Backward' check found differences between this document and previous records:\n\n";
            
            backwardResult.conflicts.forEach(conflict => {
                response += `- **${conflict.field}**:\n`;
                response += `  - Previous: \`${conflict.previousValue}\` (from ${conflict.previousSource})\n`;
                response += `  - Current: \`${conflict.currentValue}\` (extracted from this upload)\n`;
                
                alerts.push({
                    severity: conflict.severity,
                    message: `Data Conflict: ${conflict.field} mismatch - "${conflict.previousValue}" vs "${conflict.currentValue}"`,
                    relatedFactIds: [],
                    suggestedAction: "Re-examine documents for tampering or clerical errors."
                });
            });
        } else {
            response += "✅ **One Step Backward**: All extracted values align with existing shipment data.\n";
        }

        if (!forwardResult.valid) {
            response += "\n⚠️ **ONE STEP FORWARD GAPS DETECTED**\n";
            response += "Expected documents based on current facts:\n\n";
            
            forwardResult.gaps.forEach(gap => {
                response += `- **${gap.field}**: ${gap.reason}\n`;
                
                alerts.push({
                    severity: gap.severity,
                    message: `Missing: ${gap.field} - ${gap.reason}`,
                    suggestedAction: gap.reason
                });
            });
        } else {
            response += "\n✅ **One Step Forward**: All expected documents are accounted for.\n";
        }

        if (!chainResult.valid) {
            response += "\n⚠️ **CHAIN ISSUES**:\n";
            chainResult.issues.forEach(issue => {
                response += `- ${issue}\n`;
            });
        }

        if (backwardResult.valid && forwardResult.valid && chainResult.valid) {
            response += "\n✅ **FULL CHAIN VALID**: All consistency checks passed.\n";
            response += "🔗 Chain of custody is intact across the roadmap.";
        }

        return {
            success: validationResult.status === 'valid',
            response,
            alerts,
            data: { validationResult }
        };
    }
}
