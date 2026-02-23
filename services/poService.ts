import { consignmentService } from './consignmentService';
import { orchestratorService } from './orchestrator';
import { EncryptionService } from './encryptionService';
import { iotaService } from './iotaService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { logger } from './lib/logger';

async function computeHash(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface UploadPOParams {
    consignmentId: string;
    file: File;
    analysisResult: any;
}

export interface POUploadResult {
    success: boolean;
    documentHash?: string;
    iotaTxHash?: string;
    iotaExplorerUrl?: string;
    iotaTxCost?: string;
    flagged: boolean;
    agentResult?: any;
    updates?: any;
}

export const poService = {
    async uploadPurchaseOrder(params: UploadPOParams): Promise<POUploadResult> {
        const { consignmentId, file, analysisResult } = params;

        logger.log(`[POService] Uploading Purchase Order for consignment: ${consignmentId}`);

        const consignment = await consignmentService.getConsignment(consignmentId);
        if (!consignment || !consignment.encryptionKeyJwk) {
            throw new Error("Consignment not found or key missing");
        }

        const key = await EncryptionService.importKey(consignment.encryptionKeyJwk);
        const { encryptedBlob, iv } = await EncryptionService.encryptFile(file, key);
        const ivStr = EncryptionService.ivToString(iv);

        const simpleName = `PurchaseOrder_${Date.now()}.enc`;
        const storagePath = `consignments/${consignmentId}/${simpleName}`;

        const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('./lib/firebase');

        const fileRef = await import('firebase/storage').then(f => f.ref(storage, storagePath));
        await uploadBytes(fileRef, encryptedBlob, { contentType: 'application/octet-stream' });
        const fileUrl = await getDownloadURL(fileRef);

        const documentHash = await computeHash(encryptedBlob);

        let iotaTxHash: string | undefined;
        let iotaExplorerUrl: string | undefined;
        let iotaTxCost: string | undefined;
        let iotaError: string | undefined;

        try {
            const ownerId = consignment.ownerId;
            if (ownerId) {
                const userDoc = await getDoc(doc(db, 'users', ownerId));
                const iotaPrivateKey = userDoc.data()?.iotaPrivateKey;

                if (iotaPrivateKey) {
                    const anchorResult = await iotaService.anchorDocumentHash(
                        iotaPrivateKey,
                        documentHash,
                        { consignmentId, docType: 'Purchase Order' }
                    );
                    iotaTxHash = anchorResult.digest;
                    iotaExplorerUrl = anchorResult.explorerUrl;
                    iotaTxCost = anchorResult.txCost;
                }
            }
        } catch (error: any) {
            console.warn('[POService] IOTA anchoring failed:', error);
            iotaError = `Anchoring failed: ${error.message || 'Unknown error. Check wallet balance.'}`;
        }

        const orchestratorResult = await orchestratorService.handlePOUpload({
            consignmentId,
            documentType: 'Purchase Order',
            file,
            analysisResult
        });

        const flagged = orchestratorResult.alerts?.some(a => a.severity === 'critical' || a.severity === 'warning');

        const roadmapUpdates = {
            ...orchestratorResult.roadmapUpdates,
            'Purchase Order': {
                ...orchestratorResult.roadmapUpdates?.['Purchase Order'],
                fileUrl,
                fileIv: ivStr,
                documentHash,
                iotaTxHash: iotaTxHash || null,
                iotaExplorerUrl: iotaExplorerUrl || null,
                iotaTxCost: iotaTxCost || null,
                iotaError: iotaError || null,
                uploadedAt: new Date().toISOString()
            }
        };

        await orchestratorService.applyUpdates(consignmentId, {
            roadmap: roadmapUpdates,
            agentState: orchestratorResult.agentStateUpdates
        });

        return {
            success: true,
            documentHash,
            iotaTxHash,
            iotaExplorerUrl,
            iotaTxCost,
            flagged,
            agentResult: {
                response: orchestratorResult.response,
                alerts: orchestratorResult.alerts,
                activityLog: orchestratorResult.activityLog
            },
            updates: {
                roadmap: roadmapUpdates
            }
        };
    }
};
