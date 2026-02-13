import { db, storage } from './lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, setDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { EncryptionService } from './encryptionService';
import { iotaService } from './iotaService';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';

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
                console.log(`[ConsignmentService] Creating L1 Object for ${internalId}...`);
                const iotaObj = await iotaService.registerConsignment(
                    pk,
                    internalId, // Passing Internal ID for on-chain map
                    {
                        sellerName: 'Exporter Inc', // These details are hashed, not stored
                        buyerName: 'Importer LLC',
                        originCountry: data.exportFrom || 'Unknown',
                        destinationCountry: data.importTo || 'Unknown',
                        products: [], // Optimized out
                        documentHashes: []
                    }
                );
                iotaObjectId = iotaObj.id;
                console.log(`[ConsignmentService] L1 Object Created: ${iotaObjectId}`);

                // Update Firestore linkage
                await updateDoc(docRef, { iotaObjectId });
            }
        } catch (e) {
            console.error("IOTA L1 Registration Failed (Non-blocking):", e);
        }

        return { id: internalId, iotaObjectId, ...consignment };
    },

    getConsignment: async (id: string) => {
        const docRef = doc(db, 'consignments', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as Consignment;
        return null;
    },

    deleteConsignment: async (id: string) => {
        // SOFT DELETE (Archive) - Preserves data for traceability/audit
        const docRef = doc(db, 'consignments', id);
        await updateDoc(docRef, { status: 'Archived' });
        console.log(`[ConsignmentService] Archived consignment ${id}`);
    },

    // Generic Update (for partial updates like Product, HS Code, Roadmap)
    updateConsignment: async (id: string, data: any) => {
        const docRef = doc(db, 'consignments', id);
        await updateDoc(docRef, data);
    },


    // New: Update Route and Regenerate Roadmap (for Self-Correcting Workflow)
    // New: Update Route and Regenerate Roadmap (for Self-Correcting Workflow)
    updateConsignmentRoute: async (consignmentId: string, newOrigin: string, newDestination: string, analysisResult: any, flaggingDocType?: string) => {
        const docRef = doc(db, 'consignments', consignmentId);

        // 1. Update Core Route
        await updateDoc(docRef, {
            exportFrom: newOrigin,
            importTo: newDestination
        });

        // 2. Fetch current roadmap
        const snap = await getDoc(docRef);
        const currentRoadmap = snap.exists() ? snap.data().roadmap || {} : {};
        const updatedRoadmap = { ...currentRoadmap };

        // 3. Resolve the Flagging Document (The "Self-Correction")
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

        // 4. Pre-Fill Roadmap from AI Analysis Checklist
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

        await updateDoc(docRef, { roadmap: updatedRoadmap });
    },

    // Delete a specific item from the roadmap (for removing Advised items)
    deleteRoadmapItem: async (consignmentId: string, docName: string) => {
        const docRef = doc(db, 'consignments', consignmentId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const currentRoadmap = snap.data().roadmap || {};
            const updatedRoadmap = { ...currentRoadmap };
            delete updatedRoadmap[docName];
            await updateDoc(docRef, { roadmap: updatedRoadmap });
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

        // 3. Upload to Storage
        const simpleName = `${docType.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}.enc`;
        const storagePath = `consignments/${consignmentId}/${simpleName}`;
        const storageRef = ref(storage, storagePath);

        console.log(`[ConsignmentService] Uploading blob to ${storagePath}: size=${encryptedBlob.size}, type=${encryptedBlob.type}`);

        try {
            await uploadBytes(storageRef, encryptedBlob, { contentType: 'application/octet-stream' });
        } catch (error: any) {
            console.error("Detailed Upload Error:", error);
            throw error;
        }
        const fileUrl = await getDownloadURL(storageRef);

        // 4. Compute document hash for IOTA anchoring
        const documentHash = await computeHash(encryptedBlob);
        console.log(`[ConsignmentService] Document hash: ${documentHash}`);

        // 5. Attempt real IOTA anchoring
        let iotaTxHash: string | undefined;
        let iotaExplorerUrl: string | undefined;

        try {
            const ownerId = consignment.ownerId; // Optimization: we already fetched consignment above
            if (ownerId) {
                const userDoc = await getDoc(doc(db, 'users', ownerId));
                let iotaPrivateKey = userDoc.data()?.iotaPrivateKey;

                if (!iotaPrivateKey) {
                    // Fallback or just log
                    console.log('[ConsignmentService] No IOTA key found.');
                }

                if (iotaPrivateKey) {
                    console.log('[ConsignmentService] Anchoring to IOTA blockchain...');
                    const anchorResult = await iotaService.anchorDocumentHash(
                        iotaPrivateKey,
                        documentHash,
                        { consignmentId, docType }
                    );
                    iotaTxHash = anchorResult.digest;
                    iotaExplorerUrl = anchorResult.explorerUrl;
                    console.log('[ConsignmentService] IOTA anchoring successful:', iotaExplorerUrl);
                } else {
                    console.warn('[ConsignmentService] Failed to obtain any IOTA key for anchoring.');
                }
            }
        } catch (iotaError) {
            console.error('[ConsignmentService] IOTA anchoring failed (continuing without):', iotaError);
        }

        // 6. Handle Flagging for Human Review
        const hasCertificationErrors = analysisResult.certificationMetadata?.validationErrors?.length > 0;

        const shouldFlag =
            analysisResult.securityAnalysis.handwrittenModifications ||
            analysisResult.routeMismatch ||
            analysisResult.securityAnalysis.tamperScore > 40 ||
            hasCertificationErrors;

        if (shouldFlag) {
            console.log('[ConsignmentService] Document flagged for human review');
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
            analysis: analysisResult,
            validationLevel: analysisResult.validationLevel,
            documentHash,
            iotaTxHash: iotaTxHash || null,
            fileUrl, // Store URL for multimodal training / audit
            storagePath, // Store path for bulk download
            timestamp: new Date().toISOString(),
            status: 'labeled_by_ai'
        });

        // 8. Prepare Roadmap Updates (Don't commit yet to allow atomicity)
        const currentRoadmap = consignment.roadmap || {};
        const updatedRoadmap = { ...currentRoadmap };

        // Add the analyzed document
        updatedRoadmap[docType] = {
            required: true,
            status: analysisResult.validationLevel === 'GREEN' ? 'Validated' :
                analysisResult.validationLevel === 'YELLOW' ? 'Pending Review' : 'Rejected',
            fileUrl: fileUrl,
            fileIv: ivStr,
            analysis: analysisResult,
            uploadedAt: new Date().toISOString(),
            documentHash,
            iotaTxHash: iotaTxHash || null,
            iotaExplorerUrl: iotaExplorerUrl || null
        };

        // If specific future documents are recommended (and we aren't in a route mismatch that needs fixing first), we could add them here.
        if (!analysisResult.routeMismatch && analysisResult.requiredNextDocuments) {
            analysisResult.requiredNextDocuments.forEach((reqDoc: any) => {
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

        return {
            success: true,
            documentHash,
            iotaExplorerUrl,
            flagged: shouldFlag,
            updates: {
                roadmap: updatedRoadmap
            }
        };
    },


    // 9. Resolve Flagged Document (Admin Action from UI) & RLHF Loop
    resolveFlaggedDocument: async (consignmentId: string, docType: string, decision: 'approved' | 'rejected', reviewerId: string = 'admin') => {
        const consignmentRef = doc(db, 'consignments', consignmentId);

        // 1. Fetch current data
        const consignmentSnap = await getDoc(consignmentRef);
        if (!consignmentSnap.exists()) throw new Error("Consignment not found");

        const data = consignmentSnap.data();
        const roadmap = data.roadmap || {};
        const docData = roadmap[docType];

        if (!docData) throw new Error("Document not found in roadmap");

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
                reviewerId
            }
        };

        await updateDoc(consignmentRef, {
            [`roadmap.${docType}`]: updatedDocData
        });

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
                resolverId: reviewerId
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

            // Logic: 
            // AI says YELLOW/RED. 
            // Human APPROVE -> AI was WRONG (False Positive).
            // Human REJECT -> AI was RIGHT (True Positive).

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
                    label: humanLabel
                },
                status: 'human_verified'
            });
            console.log(`[ConsignmentService] RLHF Loop: Captured ${humanLabel}`);
        }

        return updatedDocData;
    },

    // 10. Bulk Archive (Admin / Dev Tool)
    archiveAllConsignments: async () => {
        console.log("[ConsignmentService] Starting Bulk Archive...");
        const q = query(
            collection(db, 'consignments'),
            where('status', '!=', 'Archived')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("[ConsignmentService] No active consignments to archive.");
            return 0;
        }
        try {
            console.log("[ConsignmentService] Starting Bulk Archive...");
            const q = query(
                collection(db, 'consignments'),
                where('status', '!=', 'Archived')
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.log("[ConsignmentService] No active consignments to archive.");
                return 0;
            }

            const batchPromises = snapshot.docs.map(docSnap =>
                updateDoc(doc(db, 'consignments', docSnap.id), { status: 'Archived' })
            );

            await Promise.all(batchPromises);
            console.log(`[ConsignmentService] Successfully archived ${snapshot.size} consignments.`);
            return snapshot.size;
        } catch (error) {
            console.error("[ConsignmentService] Bulk Archive Failed:", error);
            throw error;
        }
    },

    // 11. Heal Logical Mismatches (Self-Correcting UI Flow)
    healRouteMismatch: async (consignmentId: string, docType: string, correctDestination: string) => {
        console.log(`[ConsignmentService] Healing Route Mismatch for ${consignmentId}. New Destination: ${correctDestination}`);
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

        console.log(`[ConsignmentService] Generated Merkle Root for ${consignmentId}: ${root}`);

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
