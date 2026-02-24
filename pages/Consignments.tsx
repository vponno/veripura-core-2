import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Search, Package, ArrowRight, Loader2, FileCheck, ExternalLink, MapPin, Archive } from 'lucide-react';
import { Consignment, consignmentService } from '../services/consignmentService';

const Consignments: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [consignments, setConsignments] = useState<Consignment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConsignments = async () => {
        console.log("Fetching Consignments... Current User:", currentUser?.uid);
        if (!currentUser) {
            console.log("No current user, skipping fetch.");
            return;
        }

        setLoading(true);
        try {
            // Fetch from Firestore
            const q = query(
                collection(db, 'consignments'),
                where('ownerId', '==', currentUser.uid),
                where('status', '!=', 'Archived') // Filter out archived
                // orderBy('createdAt', 'desc') // Requires index, doing client-side sort for now
            );

            console.log("Executing Firestore Query for ownerId:", currentUser.uid);
            const snapshot = await getDocs(q);
            console.log("Snapshot size:", snapshot.size);

            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Consignment));
            console.log("Fetched Items:", items);

            // Client-side sort
            items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setConsignments(items);
        } catch (error) {
            console.error("Failed to load consignments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsignments();
    }, [currentUser]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent navigation
        if (window.confirm("Archive this consignment? \n\nData will be preserved for traceability audits but hidden from this list.")) {
            try {
                await consignmentService.deleteConsignment(id);
                // Optimistic update
                setConsignments(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error("Failed to archive consignment", error);
                alert("Failed to archive consignment.");
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Consignments</h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage your export compliance records and roadmaps.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            if (!currentUser?.uid) return;
                            if (window.confirm("⚠️ ARCHIVE ALL? \n\nThis will move ALL active consignments to the archive. This action cannot be easily undone via UI.")) {
                                try {
                                    setLoading(true);
                                    const count = await consignmentService.archiveAllConsignments(currentUser.uid);
                                    alert(`Archived ${count} consignments.`);
                                    fetchConsignments(); // Refresh list
                                } catch (e) {
                                    console.error(e);
                                    alert("Failed to archive all.");
                                    setLoading(false);
                                }
                            }
                        }}
                        className="px-4 py-2 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors font-medium"
                    >
                        <Archive size={18} /> Archive All
                    </button>
                    <button
                        onClick={() => navigate('/register-consignment')}
                        className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <Package size={18} /> New Registration
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : consignments.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <Package className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No Active Consignments</h3>
                    <p className="text-slate-500 mb-4">You haven't registered any export consignments yet.</p>
                    <button
                        onClick={() => navigate('/register-consignment')}
                        className="text-primary font-semibold hover:underline"
                    >
                        Register your first consignment
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {consignments.map((item) => {
                        const completedDocs = Object.values(item.roadmap || {}).filter(d => d.status === 'Validated').length;
                        const totalDocs = Object.keys(item.roadmap || {}).length;
                        const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

                        return (
                            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/register-consignment?id=${item.id}`)}>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wide rounded ${item.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                item.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {item.status}
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">#{item.id?.slice(0, 6)}</span>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <h3 className="text-lg font-bold text-slate-800">{item.exportFrom}</h3>
                                        <ArrowRight size={16} className="text-slate-400" />
                                        <h3 className="text-lg font-bold text-slate-800">{item.importTo}</h3>
                                    </div>

                                    <div className="flex flex-wrap gap-6 text-sm">
                                        <div>
                                            <span className="text-slate-400 block text-xs mb-1">Documents</span>
                                            <span className="font-semibold flex items-center gap-1">
                                                <FileCheck size={14} className="text-primary" />
                                                {completedDocs} / {totalDocs} Verified
                                            </span>
                                        </div>
                                        <div className="flex-1 max-w-xs">
                                            <span className="text-slate-400 block text-xs mb-1">Progress</span>
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}% ` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                                        <ArrowRight size={20} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, item.id!)}
                                        className="p-2 hover:bg-slate-100 hover:text-slate-600 rounded-full text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Archive Consignment"
                                    >
                                        <Archive size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Consignments;