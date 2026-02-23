import { Skill, SkillResult } from './skillRegistry';
import { iotaService } from '../../iotaService';
import { logger } from '../../lib/logger';

export class IotaAnchorSkill implements Skill {
    id = 'iota_anchor';
    name = 'IOTA Anchor';
    description = 'Anchors document hashes to the IOTA Tangle for immutability.';

    async execute(input: {
        documentHash: string,
        metadata?: {
            privateKey: string,
            consignmentId: string,
            docType: string
        }
    }): Promise<SkillResult> {
        logger.log(`[IotaAnchor] Anchoring hash: ${input.documentHash}`);

        if (!input.metadata?.privateKey) {
            return {
                success: false,
                status: 'Error',
                message: 'IOTA Private Key missing in metadata.',
                score: 0
            };
        }

        try {
            const anchorResult = await iotaService.anchorDocumentHash(
                input.metadata.privateKey,
                input.documentHash,
                {
                    consignmentId: input.metadata.consignmentId,
                    docType: input.metadata.docType
                }
            );

            return {
                success: true,
                status: 'Anchored',
                message: 'Document anchored to IOTA blockchain.',
                score: 1.0,
                data: {
                    explorerUrl: anchorResult.explorerUrl,
                    txHash: anchorResult.digest,
                    txCost: anchorResult.txCost
                }
            };
        } catch (error: any) {
            logger.error(`[IotaAnchor] Anchoring failed: ${error.message}`);
            return {
                success: false,
                status: 'Failed',
                message: `Blockchain anchoring failed: ${error.message}`,
                score: 0,
                data: {
                    error: error.message
                }
            };
        }
    }
}
