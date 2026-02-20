import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Consignment } from '../services/consignmentService';
import { Loader2, Package, FileClock, CheckCircle2, TrendingUp } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ConsignmentProgress from '../components/dashboard/ConsignmentProgress';

const Dashboard: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [consignments, setConsignments] = useState<Consignment[]>([]);
    const [stats, setStats] = useState({
        active: 0,
        pending: 0,
        completed: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                // Fetch consignments
                const q = query(
                    collection(db, 'consignments'),
                    where('ownerId', '==', currentUser.uid),
                    where('status', '!=', 'Archived')
                );

                const snapshot = await getDocs(q);
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Consignment));

                // Sort by date desc
                items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setConsignments(items);

                // Calculate stats
                const active = items.filter(c => c.status !== 'Completed').length;
                const completed = items.filter(c => c.status === 'Completed').length;

                // "Pending Action" logic: active consignments with < 100% progress
                const pending = items.filter(c => {
                    if (c.status === 'Completed') return false;
                    const totalDocs = Object.keys(c.roadmap || {}).length;
                    const completedDocs = Object.values(c.roadmap || {}).filter(d => d.status === 'Validated').length;
                    return totalDocs > 0 && completedDocs < totalDocs;
                }).length;

                setStats({ active, pending, completed });

            } catch (error) {
                console.error("Error loading dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="ml-2 text-slate-500">Loading Dashboard...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Overview of your supply chain operations.</p>
                </div>
                <button
                    onClick={() => navigate('/register-consignment')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
                >
                    <Package size={18} /> New Consignment
                </button>
            </div>

            {/* Stats Components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Active Consignments"
                    value={stats.active}
                    icon={Package}
                    color="text-blue-600 bg-blue-50"
                />
                <StatCard
                    title="Action Required"
                    value={stats.pending}
                    icon={FileClock}
                    color="text-orange-600 bg-orange-50"
                    trend={stats.pending > 0 ? { value: stats.pending, label: 'Docs pending' } : undefined}
                />
                <StatCard
                    title="Completed Shipments"
                    value={stats.completed}
                    icon={CheckCircle2}
                    color="text-green-600 bg-green-50"
                />
            </div>

            {/* Main Content - Ongoing Consignments */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Ongoing Consignments</h2>
                    <button
                        onClick={() => navigate('/consignments')}
                        className="text-sm text-primary hover:underline font-medium"
                    >
                        View All
                    </button>
                </div>

                {consignments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                        <Package className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No active consignments</h3>
                        <p className="text-slate-500">Start by creating a new consignment.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {consignments.slice(0, 5).map(consignment => (
                            <ConsignmentProgress
                                key={consignment.id}
                                consignment={consignment}
                                onClick={() => navigate(`/register-consignment?id=${consignment.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;