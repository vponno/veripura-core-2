import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../services/lib/firebase';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Clock } from 'lucide-react';

interface ReviewItem {
    id: string; // Document ID in review_queue
    consignmentId: string;
    docType: string;
    reason: string;
    details: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const AdminReview: React.FC = () => {
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'review_queue'),
                where('status', '==', 'pending')
                // orderBy('createdAt', 'desc') // Removed to avoid index requirements for now
            );
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewItem));

            // Client-side sort
            items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setReviews(items);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const [softLabel, setSoftLabel] = useState(1.0); // 100% confidence default
    const [reasoning, setReasoning] = useState('');
    const [selectedCase, setSelectedCase] = useState<ReviewItem | null>(null);

    const handleDecision = async (item: ReviewItem, decision: 'approved' | 'rejected') => {
        // If approved, default confidence is high. If rejected, it depends.
        // For now, simple flow: 
        if (!confirm(`Confirm ${decision.toUpperCase()} decision?`)) return;

        try {
            // Lazy load service
            const { rlhfService } = await import('../services/rlhfService');

            // 1. Resolve Case via Service (Handles Queue + Training Data)
            await rlhfService.resolveCase(
                item.id,
                decision,
                softLabel,
                reasoning || "No reasoning provided.",
                'admin' // TODO: Get actual user ID
            );

            // 2. Update Consignment Roadmap (Legacy Logic - could be moved to service listener in future)
            const { updateDoc, doc, getDoc } = await import('firebase/firestore');
            const consignmentRef = doc(db, 'consignments', item.consignmentId);
            const consignmentSnap = await getDoc(consignmentRef);

            if (consignmentSnap.exists()) {
                const data = consignmentSnap.data();
                const roadmap = data.roadmap || {};
                const docData = roadmap[item.docType];

                if (docData) {
                    const newStatus = decision === 'approved' ? 'Validated' : 'Rejected';
                    const newLevel = decision === 'approved' ? 'GREEN' : 'RED';

                    const updatedDocData = {
                        ...docData,
                        status: newStatus,
                        analysis: {
                            ...docData.analysis,
                            validationLevel: newLevel,
                            requiresHumanReview: false,
                            adminDecision: decision,
                            adminDecisionAt: new Date().toISOString(),
                            rlhfConfidence: softLabel, // Capture the human's stats on the object too
                            rlhfReasoning: reasoning
                        }
                    };

                    await updateDoc(consignmentRef, {
                        [`roadmap.${item.docType}`]: updatedDocData
                    });
                }
            }

            // Reset UI
            setSoftLabel(1.0);
            setReasoning('');
            setSelectedCase(null);
            fetchReviews();

        } catch (error) {
            console.error("Error processing decision:", error);
            alert("Failed to process decision. Check console.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Review Hub</h1>
                    <p className="text-slate-500 mt-2">Manage flagged documents requiring human intervention.</p>
                </div>
                <div className="flex gap-2 text-sm text-slate-400">
                    <button
                        onClick={async () => {
                            if (!confirm("Download training dataset (JSONL)?")) return;
                            const { exportService } = await import('../services/exportService');
                            const blob = await exportService.exportTrainingDataToJSONL();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `veripura_finetune_${Date.now()}.jsonl`;
                            a.click();
                        }}
                        className="flex items-center gap-2 bg-white text-primary border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-fuchsia-50 transition-colors font-bold shadow-sm mr-4"
                    >
                        <ExternalLink size={16} /> Export Training Data
                    </button>
                    <span className="flex items-center gap-1"><Clock size={16} /> Queue Refreshed: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading queue...</div>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                    <CheckCircle className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">All Caught Up!</h3>
                    <p className="text-slate-500 mt-2">There are no pending documents for review.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reviews.map(item => (
                        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-l-4 border-l-amber-400 border-slate-100 p-6 flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Pending Review
                                    </span>
                                    <span className="text-slate-400 text-xs">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{item.docType}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">ID: {item.consignmentId.substring(0, 8)}...</span>
                                </div>

                                <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
                                    <h4 className="flex items-center gap-2 font-bold text-red-800 text-sm mb-2">
                                        <AlertTriangle size={16} /> Flagged Reason
                                    </h4>
                                    <p className="text-red-700 font-medium">{item.reason}</p>
                                    {item.details && <p className="text-red-600 text-sm mt-1">{item.details}</p>}
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <a
                                        href={`/#/register-consignment?id=${item.consignmentId}`}
                                        target="_blank"
                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                                    >
                                        <ExternalLink size={14} /> View Full Consignment Context
                                    </a>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center gap-3 border-l border-slate-100 pl-6 min-w-[250px]">

                                <div className="mb-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Human Confidence (Soft Label)</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="1.0"
                                            step="0.05"
                                            value={softLabel}
                                            onChange={(e) => setSoftLabel(parseFloat(e.target.value))}
                                            className="w-full accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-sm font-bold w-12 text-right">{(softLabel * 100).toFixed(0)}%</span>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <textarea
                                        placeholder="Reasoning (e.g., 'Typo in OCR...')"
                                        value={reasoning}
                                        onChange={(e) => setReasoning(e.target.value)}
                                        className="w-full text-sm border-slate-200 rounded-lg p-2 focus:ring-primary focus:border-primary"
                                        rows={2}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDecision(item, 'approved')}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors shadow-sm text-sm"
                                    >
                                        <CheckCircle size={16} /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleDecision(item, 'rejected')}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminReview;
