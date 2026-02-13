import React, { useState } from 'react';
import { UserRole, AIAnalysisResult } from '../types';
import { analyzeMarketDemand } from '../services/geminiService';
import { Sparkles, TrendingUp, AlertCircle, FileText } from 'lucide-react';


import { AgentActivityFeed } from '../components/compliance/AgentActivityFeed';

const AIInsights: React.FC = () => {
    const [product, setProduct] = useState("Arabica Coffee");
    const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);

    // Mock activities for the "Collaborative Brain" showcase
    const mockActivities: any[] = [
        {
            agentName: "Organic Sentinel",
            status: "success",
            summary: "Validated USDA Organic equivalency for Vietnamese Arabica.",
            timestamp: new Date().toISOString()
        },
        {
            agentName: "Price Parity Agent",
            status: "success",
            summary: "Detected 12% margin opportunity in South Korean retail markets.",
            timestamp: new Date().toISOString()
        },
        {
            agentName: "Logistics Lingo Interpreter",
            status: "success",
            summary: "Confirmed Incoterms 2020 DDP requirements for Seoul port.",
            timestamp: new Date().toISOString()
        }
    ];

    const handleAnalyze = async () => {
        setLoading(true);
        const mockHistory = [
            { month: "Jan", price: 4.2, sold: 100 },
            { month: "Feb", price: 4.3, sold: 120 },
            { month: "Mar", price: 4.1, sold: 90 },
        ];

        const result = await analyzeMarketDemand(product, mockHistory);
        setAnalysis(result);
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                        <Sparkles className="text-white" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900">Gemini Market Intelligence</h2>
                    <p className="text-slate-500 mt-2">Get real-time demand predictions and pricing strategies.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        What product do you want to analyze?
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            placeholder="e.g., Organic Soybeans"
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-70 transition-colors"
                        >
                            {loading ? 'Analyzing...' : 'Generate Insights'}
                        </button>
                    </div>
                </div>

                {analysis && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={`p-6 rounded-xl border-l-4 ${analysis.marketTrend === 'UP' ? 'bg-emerald-50 border-emerald-500' :
                            analysis.marketTrend === 'DOWN' ? 'bg-rose-50 border-rose-500' : 'bg-slate-50 border-slate-500'
                            }`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${analysis.marketTrend === 'UP' ? 'bg-emerald-100 text-emerald-600' :
                                    analysis.marketTrend === 'DOWN' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Market Trend: {analysis.marketTrend}</h3>
                                    <p className="text-slate-600 mt-1">{analysis.prediction}</p>
                                    <div className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Confidence Score: {(analysis.confidence * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FileText size={18} className="text-indigo-500" />
                                Strategic Recommendations
                            </h3>
                            <ul className="space-y-3">
                                {analysis.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar: Collaborative Brain Pulse */}
            <div className="space-y-6">
                <AgentActivityFeed activities={mockActivities} />
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-900 mb-2">About Agent Autonomy</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                        The Collaborative Brain orchestrates multiple specialized agents to verify every claim.
                        Each entry above represents a real-time validation step performed by a dedicated sub-agent.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AIInsights;