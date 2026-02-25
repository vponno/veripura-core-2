import { db, storage } from './lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, setDoc, query, where, getDocs, deleteDoc, FieldPath, onSnapshot, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { EncryptionService } from './encryptionService';
import { iotaService } from './iotaService';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';
import { logger } from './lib/logger';

// Helper: Remove undefined values for Firestore compatibility
const removeUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => removeUndefined(item));
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = removeUndefined(value);
        }
    }
    return cleaned;
};

export interface AgentMessage {
    id: string;
    sender: 'user' | 'agent';
    content: string;
    timestamp: string;
    type: 'text' | 'alert' | 'success';
    relatedDocId?: string;
}

export interface Consignment {
    id?: string;
    ownerId: string;
    exportFrom: string;
    importTo: string;
    sellerName?: string;
    buyerName?: string;
    status: 'Draft' | 'In Progress' | 'Completed' | 'Archived' | 'Held at Customs';
    createdAt: string;
    encryptionKeyJwk?: string; // Storing key for MVP (In prod, use user's private key)
    product?: string; // Legacy/Single simple product
    hsCode?: string; // Legacy/Single simple HS Code
    products?: Array<{
        name: string;
        hsCode?: string;
        attributes?: string[];
        quantity?: string; // e.g. "5000 kg"
        packaging?: string; // e.g. "200 Cartons"
        volume?: string; // e.g. "10 cbm"
        weight?: string; // e.g. "5200 kg Gross"
    }>;
    agentState?: {
        messages: AgentMessage[];
        unreadCount: number;
        lastActive: string;
        activityLog?: import('../types').AgentActivity[];
    };
    // NEW: Guardian Agent State
    guardianAgent?: import('../types').AgentState;
    roadmap: {
        [key: string]: {
            required: boolean;
            status: 'Pending' | 'Uploaded' | 'Validated' | 'Rejected' | 'Pending Review';
            fileUrl?: string; // Encrypted file path
            fileIv?: string;  // IV for decryption
            analysis?: any;
            uploadedAt?: string;
            // IOTA Anchoring
            documentHash?: string; // SHA-256 hash of the encrypted blob
            iotaTxHash?: string;   // IOTA transaction hash (if anchored)
            iotaExplorerUrl?: string; // Link to IOTA explorer
            iotaTxCost?: string;   // New: Transaction cost in IOTA
            iotaError?: string;    // New: Last anchoring error if any
            description?: string; // For auto-generated tasks
            agencyLink?: string;  // For auto-generated tasks
        }
    }
    // Consistency Validation History
    validationHistory?: Array<{
        id: string;
        timestamp: string;
        documentType?: string;
        eventType: 'upload' | 'scheduled' | 'manual';
        backwardValid: boolean;
        forwardValid: boolean;
        conflictCount: number;
        gapCount: number;
        status: 'valid' | 'flagged';
        summary: string;
    }>;
    // Merkle Tree / Finalization
    merkle_root?: string;
    iotaTxHash?: string;
    iotaExplorerUrl?: string;
    completedAt?: string;
}

// Helper: Compute SHA-256 hash of a blob
async function computeHash(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const consignmentService = {
    // create a new consignment
    createConsignment: async (userId: string, data: Partial<Consignment> & { additionalRequirements?: string[] }) => {
        // Generate a fresh encryption key for this consignment
        const key = await EncryptionService.generateKey();
        const keyJwk = await EncryptionService.exportKey(key);

        const initialRoadmap: any = data.roadmap || {};

        // REMOVED Default Standard Documents Seeding per user request
        // if (Object.keys(initialRoadmap).length === 0) { ... }

        const consignment: Consignment = {
            ownerId: userId,
            exportFrom: data.exportFrom || '', // No default countries
            importTo: data.importTo || '',
            status: 'In Progress',
            createdAt: new Date().toISOString(),
            encryptionKeyJwk: keyJwk,
            roadmap: initialRoadmap
        };

        const docRef = await addDoc(collection(db, 'consignments'), consignment);
        const internalId = docRef.id;

        // IOTA L1 Integration (Lean Storage)
        let iotaObjectId = null;
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            const pk = userDoc.data()?.iotaPrivateKey;

            if (pk) {
                logger.log(`[ConsignmentService] Creating L1 Object for ${internalId}...`);

                // Use actual trade data from the 'data' argument if provided, or default to unknowns
                const iotaObj = await iotaService.registerConsignment(
                    pk,
                    internalId,
                    {
                        sellerName: (data as any)?.sellerName || 'Unknown',
                        buyerName: (data as any)?.buyerName || 'Unknown',
                        originCountry: data.exportFrom || 'Unknown',
                        destinationCountry: data.importTo || 'Unknown',
                        products: data.products?.map(p => p.name) || [],
                        documentHashes: []
                    }
                );
                iotaObjectId = iotaObj.id;
                logger.log(`[ConsignmentService] L1 Object Created: ${iotaObjectId}`);

                // Update Firestore linkage
                await updateDoc(docRef, { iotaObjectId });
            }
        } catch (e) {
            console.error("IOTA L1 Registration Failed (Non-blocking):", e);
        }

        return { id: internalId, iotaObjectId, ...consignment };
    },

    // 1. Get a single consignment (One-time Fetch)
    getConsignment: async (id: string): Promise<Consignment | null> => {
        const docRef = doc(db, 'consignments', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Consignment : null;
    },

    // 1b. Subscribe to a consignment (Real-time)
    subscribeToConsignment: (id: string, callback: (consignment: Consignment) => void) => {
        const docRef = doc(db, 'consignments', id);
        return onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                callback({ id: snap.id, ...snap.data() } as Consignment);
            }
        });
    },

    deleteConsignment: async (id: string) => {
        // SOFT DELETE (Archive) - Preserves data for traceability/audit
        const docRef = doc(db, 'consignments', id);
        await updateDoc(docRef, { status: 'Archived' });
        logger.log(`[ConsignmentService] Archived consignment ${id}`);
    },

    // Generic Update (for partial updates like Product, HS Code, Roadmap)
    updateConsignment: async (id: string, data: any) => {
        // Debug: Log ALL keys and values to identify the issue
        console.log('🔍 updateConsignment called with data keys:', Object.keys(data || {}));

        if (data && typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
                console.log(`🔍   Key: "${key}" (type: ${typeof key}), Value type: ${typeof value}`);
                if (typeof key !== 'string') {
                    console.error(`🔍💥 NON-STRING KEY DETECTED! Key:`, key, 'Full data:', JSON.stringify(data).slice(0, 500));
                    throw new Error(`Non-string key in updateDoc: ${String(key)}`);
                }
            }
        }
        
        // Remove undefined values for Firestore compatibility
        const cleanData = removeUndefined(data);
        
        const docRef = doc(db, 'consignments', id);
        try {
            await updateDoc(docRef, cleanData);
        } catch (err: any) {
            console.error('🔍💥 updateDoc FAILED:', err.message);
            console.error('🔍💥 Data being written:', JSON.stringify(cleanData).slice(0, 1000));
            throw err;
        }
    },


    // New: Update Route and Regenerate Roadmap (for Self-Correcting Workflow)
    // New: Update Route and Regenerate Roadmap (for Self-Correcting Workflow)
    updateConsignmentRoute: async (consignmentId: string, newOrigin: string, newDestination: string, analysisResult: any, flaggingDocType?: string) => {
        const docRef = doc(db, 'consignments', consignmentId);

        // 1. Fetch current roadmap
        const snap = await getDoc(docRef);
        const currentRoadmap = snap.exists() ? snap.data().roadmap || {} : {};
        const updatedRoadmap = { ...currentRoadmap };

        // 2. Resolve the Flagging Document (The "Self-Correction")
        // If we know which document caused the mismatch, we "heal" it now.
        if (flaggingDocType && updatedRoadmap[flaggingDocType]) {
            const docItem = updatedRoadmap[flaggingDocType];

            // Remove the mismatch flag from analysis
            if (docItem.analysis) {
                docItem.analysis.routeMismatch = false;
                docItem.analysis.routeMismatchWarning = null;

                // If this was the ONLY reason for 'YELLOW', we might consider upgrading to 'GREEN' / 'Validated'
                // However, to be safe, if there are NO other flags (like handwritten), we promote it.
                // If there ARE handwritten mods, it stays YELLOW but the route warning is gone.
                const hasHandwritten = docItem.analysis.securityAnalysis?.handwrittenModifications;
                const hasHighTamper = docItem.analysis.securityAnalysis?.tamperScore > 40;

                if (!hasHandwritten && !hasHighTamper) {
                    docItem.status = 'Validated';
                    docItem.analysis.validationLevel = 'GREEN';
                    docItem.analysis.requiresHumanReview = false;
                    docItem.analysis.reviewReason = null;
                } else {
                    // Still requires human review, but reason is now just the other stuff
                    docItem.analysis.reviewReason = hasHandwritten ? 'Handwritten modifications detected' : 'High tamper score detected';
                }
            }
        }

        // 3. Pre-Fill Roadmap from AI Analysis Checklist
        // If the AI found "requiredNextDocuments", we use them to populate the roadmap.
        if (analysisResult && analysisResult.requiredNextDocuments) {
            analysisResult.requiredNextDocuments.forEach((reqDoc: any) => {
                // If this doc type isn't already in the roadmap, add it as 'Pending'
                if (!updatedRoadmap[reqDoc.name]) {
                    updatedRoadmap[reqDoc.name] = {
                        required: true,
                        status: 'Pending',
                        description: reqDoc.description,
                        agencyLink: reqDoc.agencyLink
                    };
                }
            });
        }

        // 4. Update core fields and roadmap items atomically
        const updates: any = {
            exportFrom: newOrigin,
            importTo: newDestination
        };

        // Convert roadmap changes to atomic field updates
        Object.entries(updatedRoadmap).forEach(([key, value]) => {
            // Sanitize key and use dot notation
            const safeKey = String(key)
                .replace(/^[.]+/, '')
                .replace(/[~*\/\[\\\]]/g, '_')
                .trim();
            if (safeKey) {
                updates[`roadmap.${safeKey}`] = value;
            }
        });

        await updateDoc(docRef, updates);
    },

    // Delete a specific item from the roadmap (for removing Advised items)
    deleteRoadmapItem: async (consignmentId: string, docName: string) => {
        const docRef = doc(db, 'consignments', consignmentId);
        // Sanitize docName for Firestore field path
        const safeDocName = String(docName)
            .replace(/^[.]+/, '')
            .replace(/[~*\/\[\\\]]/g, '_')
            .trim();
        if (safeDocName) {
            // ATOMIC DELETION: Use deleteField() with FieldPath
            await updateDoc(docRef, new FieldPath('roadmap', safeDocName), deleteField());
        }
    },

    // Update Upload Step to Pre-Fill Roadmap Immediately on First Upload too
    // Update Upload Step to Pre-Fill Roadmap Immediately on First Upload too
    uploadDocumentStep: async (consignmentId: string, docType: string, file: File, analysisResult: any) => {
        const consignment = await consignmentService.getConsignment(consignmentId);
        if (!consignment || !consignment.encryptionKeyJwk) throw new Error("Consignment not found or key missing");

        // ... (Crypto & Upload logic remains same) ...

        // 1. Import Key
        const key = await EncryptionService.importKey(consignment.encryptionKeyJwk);

        // 2. Encrypt File
        const { encryptedBlob, iv } = await EncryptionService.encryptFile(file, key);
        const ivStr = EncryptionService.ivToString(iv);
        logger.log(`[ConsignmentService] Encrypted file. ContentType: ${file.type}, IV: ${ivStr}`);

        // 3. Upload to Storage
        const simpleName = `${docType.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}.enc`;
        const storagePath = `consignments/${consignmentId}/${simpleName}`;
        const storageRef = ref(storage, storagePath);

        logger.log(`[ConsignmentService] Uploading blob to ${storagePath}: size=${encryptedBlob.size}, type=${encryptedBlob.type}`);

        try {
            await uploadBytes(storageRef, encryptedBlob, { contentType: 'application/octet-stream' });
        } catch (error: any) {
            console.error("Detailed Upload Error:", error);
            throw error;
        }
        const fileUrl = await getDownloadURL(storageRef);

        // 4. Compute document hash for IOTA anchoring
        const documentHash = await computeHash(encryptedBlob);
        logger.log(`[ConsignmentService] Document hash: ${documentHash}`);

        // 5. Attempt real IOTA anchoring
        let iotaTxHash: string | undefined;
        let iotaExplorerUrl: string | undefined;
        let iotaTxCost: string | undefined;
        let iotaError: string | undefined;

        try {
            const ownerId = consignment.ownerId; // Optimization: we already fetched consignment above
            if (ownerId) {
                const userDoc = await getDoc(doc(db, 'users', ownerId));
                let iotaPrivateKey = userDoc.data()?.iotaPrivateKey;

                if (!iotaPrivateKey) {
                    // Fallback or just log
                    logger.log('[ConsignmentService] No IOTA key found.');
                }

                if (iotaPrivateKey) {
                    logger.log('[ConsignmentService] Anchoring to IOTA blockchain...');
                    const anchorResult = await iotaService.anchorDocumentHash(
                        iotaPrivateKey,
                        documentHash,
                        { consignmentId, docType }
                    );
                    iotaTxHash = anchorResult.digest;
                    iotaExplorerUrl = anchorResult.explorerUrl;
                    iotaTxCost = anchorResult.txCost;
                    logger.log('[ConsignmentService] IOTA anchoring successful:', iotaExplorerUrl, 'Cost:', iotaTxCost);
                } else {
                    console.warn('[ConsignmentService] Failed to obtain any IOTA key for anchoring.');
                }
            }
        } catch (err: any) {
            console.error('[ConsignmentService] IOTA anchoring failed (continuing without):', err);
            iotaError = err.message || 'Unknown IOTA error';
        }

        // 6. Handle Flagging for Human Review
        const hasCertificationErrors = analysisResult.certificationMetadata?.validationErrors?.length > 0;

        const shouldFlag =
            analysisResult.securityAnalysis.handwrittenModifications ||
            analysisResult.routeMismatch ||
            analysisResult.securityAnalysis.tamperScore > 40 ||
            hasCertificationErrors;

        if (shouldFlag) {
            logger.log('[ConsignmentService] Document flagged for human review');
            analysisResult.validationLevel = 'YELLOW'; // Or RED if critical, but YELLOW forces review
            analysisResult.requiresHumanReview = true;

            let reason = 'High tamper score detected';
            if (analysisResult.securityAnalysis.handwrittenModifications) reason = 'Handwritten modifications detected';
            else if (analysisResult.routeMismatch) reason = 'Route mismatch detected';
            else if (hasCertificationErrors) reason = `Certification Warning: ${analysisResult.certificationMetadata.validationErrors[0]}`;

            analysisResult.reviewReason = reason;

            // Create Email Alert
            await addDoc(collection(db, 'mail'), {
                to: 'team@veripura.com',
                message: {
                    subject: `[VeriPura Review] Flagged Document: ${docType}`,
                    html: `
                        <h2>⚠️ Document Requires Human Review</h2>
                        <p><strong>Consignment ID:</strong> ${consignmentId}</p>
                        <p><strong>Document Type:</strong> ${docType}</p>
                        <p><strong>Flag Reason:</strong> ${analysisResult.reviewReason}</p>
                        <hr/>
                        <p><a href="https://veripura-connect-live.web.app/consignment/${consignmentId}">View Consignment & Review Document</a></p>
                    `
                },
                createdAt: new Date().toISOString()
            });

            // Add to Review Queue
            await addDoc(collection(db, 'review_queue'), {
                consignmentId,
                docType,
                reason: analysisResult.reviewReason,
                details: hasCertificationErrors
                    ? analysisResult.certificationMetadata.validationErrors.join(', ')
                    : (analysisResult.securityAnalysis.handwrittenDetails || ''),
                status: 'pending',
                createdAt: new Date().toISOString()
            });
        }

        // 7. Save Training Data
        await addDoc(collection(db, 'training_dataset'), {
            consignmentId,
            docType,
            analysis: removeUndefined(analysisResult),
            validationLevel: analysisResult.validationLevel,
            documentHash,
            iotaTxHash: iotaTxHash || null,
            iotaTxCost: iotaTxCost || null,
            iotaError: iotaError || null,
            fileUrl: fileUrl || null,  // Use null instead of undefined
            storagePath: storagePath || null,  // Use null instead of undefined
            timestamp: new Date().toISOString(),
            status: 'labeled_by_ai'
        });

        // 8. ATOMIC UPDATE: Send only the specific document data to avoid clobbering
        const roadmapUpdates: any = {};
        const docRef = doc(db, 'consignments', consignmentId);

        // Sanitize docType for Firestore field path
        const safeDocType = String(docType)
            .replace(/^[.]+/, '')
            .replace(/[~*\/\[\\\]]/g, '_')
            .trim();

        // Update the current document
        if (safeDocType) {
            roadmapUpdates[`roadmap.${safeDocType}`] = {
                required: true,
                status: analysisResult.validationLevel === 'GREEN' ? 'Validated' :
                    analysisResult.validationLevel === 'YELLOW' ? 'Pending Review' : 'Rejected',
                fileUrl: fileUrl,
                fileIv: ivStr,
                fileType: file.type,
                analysis: analysisResult,
                uploadedAt: new Date().toISOString(),
                documentHash,
                iotaTxHash: iotaTxHash || null,
                iotaExplorerUrl: iotaExplorerUrl || null,
                iotaTxCost: iotaTxCost || null,
                iotaError: iotaError || null
            };
        }

        // Add any recommended future documents (also atomically)
        if (!analysisResult.routeMismatch && analysisResult.requiredNextDocuments) {
            analysisResult.requiredNextDocuments.forEach((reqDoc: any) => {
                // Sanitize doc name for Firestore
                const safeReqDocName = String(reqDoc.name || 'Unknown')
                    .replace(/^[.]+/, '')
                    .replace(/[~*\/\[\\\]]/g, '_')
                    .trim();

                if (safeReqDocName) {
                    roadmapUpdates[`roadmap.${safeReqDocName}`] = {
                        required: true,
                        status: 'Pending',
                        description: reqDoc.description,
                        agencyLink: reqDoc.agencyLink
                    };
                }
            });
        }

        await updateDoc(docRef, roadmapUpdates);

        // Return updates for local optimistic state if needed (though onSnapshot handles this)
        return {
            success: true,
            documentHash,
            iotaExplorerUrl,
            flagged: shouldFlag,
            updates: {
                roadmap: roadmapUpdates
            }
        };
    },


    // Safe update for roadmap item (prevents dot-notation corruption)
    updateRoadmapItem: async (consignmentId: string, docType: string, data: any) => {
        const docRef = doc(db, 'consignments', consignmentId);
        // Sanitize docType for Firestore field path
        const safeDocType = String(docType)
            .replace(/^[.]+/, '')
            .replace(/[~*\/\[\\\]]/g, '_')
            .trim();
        if (safeDocType) {
            // Remove undefined values for Firestore compatibility
            const cleanData = removeUndefined(data);
            console.log('🔍 updateRoadmapItem:', safeDocType, 'data keys:', Object.keys(cleanData || {}));
            try {
                await updateDoc(docRef, new FieldPath('roadmap', safeDocType), cleanData);
            } catch (err: any) {
                console.error('🔍💥 updateRoadmapItem FAILED:', err.message);
                console.error('🔍💥 Data:', JSON.stringify(cleanData).slice(0, 500));
                throw err;
            }
        }
    },

    // 9. Resolve Flagged Document (Admin Action from UI) & RLHF Loop
    resolveFlaggedDocument: async (consignmentId: string, docType: string, decision: 'approved' | 'rejected', reasoning: string = '', softLabel: number = 1.0, reviewerId: string = 'admin') => {
        const consignmentRef = doc(db, 'consignments', consignmentId);

        // Sanitize docType for Firestore field path
        const safeDocType = String(docType)
            .replace(/^[.]+/, '')
            .replace(/[~*\/\[\\\]]/g, '_')
            .trim();

        // 1. Fetch current data
        const consignmentSnap = await getDoc(consignmentRef);
        if (!consignmentSnap.exists()) throw new Error("Consignment not found");

        const data = consignmentSnap.data();
        const roadmap = data.roadmap || {};
        const docData = roadmap[safeDocType];

        if (!docData) throw new Error(`Document "${safeDocType}" not found in roadmap`);

        // 2. Update Consignment Roadmap
        const newStatus = decision === 'approved' ? 'Validated' : 'Rejected';
        const newLevel = decision === 'approved' ? 'GREEN' : 'RED';

        const updatedDocData = {
            ...docData,
            status: newStatus,
            analysis: {
                ...docData.analysis,
                validationLevel: newLevel,
                requiresHumanReview: false, // Clear flag
                adminDecision: decision,
                adminDecisionAt: new Date().toISOString(),
                adminReasoning: reasoning,
                adminConfidence: softLabel,
                reviewerId
            }
        };

        // Use FieldPath to safely update even if docType contains dots (e.g. "P.O.")
        await updateDoc(consignmentRef, new FieldPath('roadmap', safeDocType), updatedDocData);

        // 3. Resolve from Review Queue (if exists)
        const q = query(
            collection(db, 'review_queue'),
            where('consignmentId', '==', consignmentId),
            where('docType', '==', docType),
            where('status', '==', 'pending')
        );
        const queueSnap = await getDocs(q);

        if (!queueSnap.empty) {
            const queueDoc = queueSnap.docs[0];
            await updateDoc(doc(db, 'review_queue', queueDoc.id), {
                status: decision,
                resolvedAt: new Date().toISOString(),
                resolverId: reviewerId,
                humanReview: {
                    decision,
                    reasoning,
                    softLabel,
                    reviewer: reviewerId,
                    reviewedAt: new Date().toISOString()
                }
            });
        }

        // 4. RLHF: Capture Golden Label
        const trainingQuery = query(
            collection(db, 'training_dataset'),
            where('consignmentId', '==', consignmentId),
            where('docType', '==', docType)
        );
        const trainingDocs = await getDocs(trainingQuery);

        if (!trainingDocs.empty) {
            const trainingDoc = trainingDocs.docs[0];
            const aiData = trainingDoc.data();
            const aiValidationLevel = aiData.validationLevel; // e.g., 'YELLOW'

            let humanLabel = 'UNCERTAIN';
            if (decision === 'approved') {
                humanLabel = aiValidationLevel === 'GREEN' ? 'AGREED' : 'DISAGREED_FALSE_POSITIVE';
            } else {
                humanLabel = (aiValidationLevel === 'RED' || aiValidationLevel === 'YELLOW') ? 'AGREED' : 'DISAGREED_FALSE_NEGATIVE';
            }

            await updateDoc(doc(db, 'training_dataset', trainingDoc.id), {
                humanReview: {
                    decision,
                    reviewer: reviewerId,
                    reviewedAt: new Date().toISOString(),
                    label: humanLabel,
                    reasoning,
                    confidence: softLabel
                },
                status: 'human_verified'
            });
            logger.log(`[ConsignmentService] RLHF Loop: Captured ${humanLabel}`);
        } else {
            // Create training data if it doesn't exist (e.g. legacy documents)
            await addDoc(collection(db, 'training_dataset'), {
                consignmentId,
                docType,
                analysis: docData.analysis,
                humanReview: {
                    decision,
                    reviewer: reviewerId,
                    reviewedAt: new Date().toISOString(),
                    reasoning,
                    confidence: softLabel
                },
                status: 'human_verified',
                timestamp: new Date().toISOString()
            });
        }

        return updatedDocData;
    },

    // 10. Bulk Archive (User Scoped)
    archiveAllConsignments: async (userId: string) => {
        logger.log(`[ConsignmentService] Starting Bulk Archive for user ${userId}...`);
        try {
            const q = query(
                collection(db, 'consignments'),
                where('ownerId', '==', userId),
                where('status', '!=', 'Archived')
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                logger.log("[ConsignmentService] No active consignments to archive.");
                return 0;
            }

            // Use writeBatch for atomic bulk operation (limited to 500 docs)
            const { writeBatch } = await import('firebase/firestore');
            const batch = writeBatch(db);

            snapshot.docs.forEach(docSnap => {
                batch.update(doc(db, 'consignments', docSnap.id), { status: 'Archived' });
            });

            await batch.commit();

            logger.log(`[ConsignmentService] Successfully archived ${snapshot.size} consignments for user ${userId}.`);
            return snapshot.size;
        } catch (error) {
            console.error("[ConsignmentService] Bulk Archive Failed:", error);
            throw error;
        }
    },

    // 11. Heal Logical Mismatches (Self-Correcting UI Flow)
    healRouteMismatch: async (consignmentId: string, docType: string, correctDestination: string) => {
        logger.log(`[ConsignmentService] Healing Route Mismatch for ${consignmentId}. New Destination: ${correctDestination}`);
        const docRef = doc(db, 'consignments', consignmentId);

        // 1. Update the consignment's importTo country
        await updateDoc(docRef, {
            importTo: correctDestination,
            status: 'In Progress'
        });

        // 2. Fetch current roadmap to update the flagging document status
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            const roadmap = data.roadmap || {};
            const docItem = roadmap[docType];

            if (docItem && docItem.analysis) {
                docItem.status = 'Validated';
                docItem.analysis.routeMismatch = false;
                docItem.analysis.validationLevel = 'GREEN';
                docItem.analysis.requiresHumanReview = false;
                docItem.analysis.reviewReason = null;

                docItem.analysis.healedAt = new Date().toISOString();
                docItem.analysis.healType = 'ROUTE_MISMATCH';

                await updateDoc(docRef, { roadmap });
            }
        }

        return { success: true };
    },

    // 12. Finalize Consignment (Merkle Anchor)
    finalizeConsignment: async (consignmentId: string, userId: string) => {
        const consignment = await consignmentService.getConsignment(consignmentId);
        if (!consignment) throw new Error("Consignment not found");

        const roadmap = consignment.roadmap || {};
        const docs: import('./merkleService').ConsignmentDocument[] = [];

        // Collect valid documents
        for (const [docType, data] of Object.entries(roadmap)) {
            if (data.documentHash && (data.status === 'Validated' || data.status === 'Uploaded')) {
                docs.push({
                    docType,
                    description: data.description || docType,
                    fileHash: data.documentHash
                });
            }
        }

        if (docs.length === 0) throw new Error("No documents to anchor.");

        // Build Tree
        const { ConsignmentMerkleTree } = await import('./merkleService');
        const tree = new ConsignmentMerkleTree(docs);
        const root = tree.getRoot();

        logger.log(`[ConsignmentService] Generated Merkle Root for ${consignmentId}: ${root}`);

        // Anchor to IOTA
        let iotaTxHash = null;
        let iotaExplorerUrl = null;

        try {
            // Use ownerId from consignment to ensure correct signer
            const ownerId = consignment.ownerId;
            const userDoc = await getDoc(doc(db, 'users', ownerId));
            const pk = userDoc.data()?.iotaPrivateKey;

            if (pk) {
                const result = await iotaService.anchorMerkleRoot(pk, root, consignmentId);
                iotaTxHash = result.digest;
                iotaExplorerUrl = result.explorerUrl;
            } else {
                console.warn("No IOTA Key found for owner, skipping on-chain anchor.");
            }
        } catch (e) {
            console.error("Merkle Anchoring Failed:", e);
            // Continue to save the root locally
        }

        // Update Consignment
        await updateDoc(doc(db, 'consignments', consignmentId), {
            merkle_root: root,
            status: 'Completed',
            iotaTxHash: iotaTxHash, // Fallback removed as 'fields' doesn't exist on this type
            iotaExplorerUrl,
            completedAt: new Date().toISOString()
        });

        return { root, iotaTxHash, iotaExplorerUrl };
    }
};
