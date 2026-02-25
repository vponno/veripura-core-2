import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { AgentAlert, RLHFReviewCase } from '../types';
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

export const rlhfService = {

    /**
     * Creates a new case in the Admin Review Queue.
     * Triggered when an alert has low confidence or high severity.
     */
    createReviewCase: async (
        consignmentId: string,
        docType: string,
        alert: AgentAlert,
        analysisDraft: any,
        fileUrl?: string
    ) => {
        try {
            // Check for existing pending case to avoid duplicates
            const q = query(
                collection(db, 'review_queue'),
                where('consignmentId', '==', consignmentId),
                where('docType', '==', docType),
                where('status', '==', 'pending')
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                logger.log(`[RLHF] Pending case already exists for ${docType}`);
                return;
            }

            const newCase: Omit<RLHFReviewCase, 'id'> = {
                consignmentId,
                docType,
                reason: alert.message,
                details: alert.suggestedAction || 'No suggested action.',
                aiAnalysis: removeUndefined(analysisDraft),
                aiConfidence: alert.confidence || 0.5,
                severity: alert.severity === 'critical' ? 'critical' : 'warning',
                status: 'pending',
                createdAt: new Date().toISOString(),
                ...(fileUrl ? { fileUrl } : { fileUrl: null })  // Use null instead of undefined
            };

            const docRef = await addDoc(collection(db, 'review_queue'), newCase);
            logger.log(`[RLHF] Created Review Case: ${docRef.id}`);
            return docRef.id;

        } catch (error) {
            console.error("Error creating review case:", error);
        }
    },

    /**
     * Resolves a case with a human decision and Soft Label.
     * This is the "Ground Truth" generation step.
     */
    resolveCase: async (
        caseId: string,
        decision: 'approved' | 'rejected',
        softLabel: number, // 0-100
        reasoning: string,
        reviewerId: string = 'admin'
    ) => {
        try {
            const caseRef = doc(db, 'review_queue', caseId);

            const humanReview = {
                decision,
                softLabel,
                reasoning,
                reviewer: reviewerId,
                reviewedAt: new Date().toISOString()
            };

            // 1. Update Review Queue
            await updateDoc(caseRef, {
                status: decision,
                resolvedAt: new Date().toISOString(),
                humanReview
            });

            // 2. Add to Training Dataset (The "Golden Record")
            // Fetch the full case data first to get analysis and fileUrl
            const { getDoc } = await import('firebase/firestore');
            const caseSnap = await getDoc(caseRef);
            const caseData = caseSnap.data() as RLHFReviewCase;

            await addDoc(collection(db, 'training_dataset'), {
                caseId,
                consignmentId: caseData.consignmentId,
                docType: caseData.docType,
                fileUrl: caseData.fileUrl,
                analysis: caseData.aiAnalysis,
                ...humanReview, // decision, softLabel, reasoning, reviewer, reviewedAt
                timestamp: new Date().toISOString(),
                trainingReady: true
            });

            logger.log(`[RLHF] Case ${caseId} resolved. Training data captured.`);

        } catch (error) {
            console.error("Error resolving case:", error);
            throw error;
        }
    }
};
