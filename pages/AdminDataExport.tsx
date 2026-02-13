import React, { useState, useEffect } from 'react';
import { exportService, TrainingDataExport } from '../services/exportService';
import { Download, FileJson, Database, ShieldCheck, FileText, Loader2, ExternalLink } from 'lucide-react';

const AdminDataExport: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TrainingDataExport[]>([]);
    const [stats, setStats] = useState({ total: 0, verified: 0 });

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await exportService.getVerifiedTrainingData();
            setData(result);
            setStats({
                total: result.length,
                verified: result.filter(r => r.status === 'human_verified').length
            });
        } catch (e) {
            console.error(e);
            alert("Failed to load training data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDownload = () => {
        const jsonl = exportService.generateJSONL(data);
        const filename = `veripura_finetune_${new Date().toISOString().split('T')[0]}.jsonl`;
        exportService.downloadData(jsonl, filename);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Training Data Export</h2>
                    <p className="text-slate-500 mt-1">Manage and export human-verified "Golden Labels" for AI Fine-Tuning.</p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                    <Loader2 size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-fuchsia-100 text-fuchsia-600 rounded-xl">
                        <Database size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Verified Records</p>
                        <h3 className="text-3xl font-bold text-slate-900">{stats.total}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Quality Score</p>
                        <h3 className="text-3xl font-bold text-slate-900">100%</h3>
                        <p className="text-xs text-emerald-600">Human Verified</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 justify-between group cursor-pointer hover:border-fuchsia-200 transition-colors" onClick={handleDownload}>
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-100 text-slate-600 group-hover:bg-fuchsia-600 group-hover:text-white transition-colors rounded-xl">
                            <Download size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Export Dataset</p>
                            <h3 className="text-xl font-bold text-slate-900">JSONL Format</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Preview Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Golden Label Preview</h3>
                    <span className="text-xs text-slate-400 font-mono">schema: (user_prompt, model_response)</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Source Document</th>
                                <th className="px-6 py-4">Review Decision</th>
                                <th className="px-6 py-4">Output (JSON Size)</th>
                                <th className="px-6 py-4 w-24">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No verified training data found yet. Start reviewing flagged documents!
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                            {item.id.slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.pdf_url ? (
                                                <a
                                                    href={item.pdf_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-blue-600 hover:underline"
                                                >
                                                    <FileText size={14} /> View PDF
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 italic">No PDF linked</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.review_decision?.includes('AGREED')
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {item.review_decision || 'VERIFIED'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                            {item.output.length} chars
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    const blob = new Blob([item.output], { type: 'application/json' });
                                                    const url = URL.createObjectURL(blob);
                                                    window.open(url, '_blank');
                                                }}
                                                className="text-slate-400 hover:text-fuchsia-600"
                                                title="View JSON"
                                            >
                                                <FileJson size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDataExport;
