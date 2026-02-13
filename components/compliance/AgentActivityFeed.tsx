import React, { useState } from 'react';
import {
    Terminal,
    Brain,
    CheckCircle2,
    AlertCircle,
    Clock,
    ChevronRight,
    ShieldCheck,
    Bot,
    FileText,
    Sparkles,
    ChevronDown,
    ChevronUp,
    List,
    AlertTriangle
} from 'lucide-react';
import { AgentActivity } from '../../types';

interface AgentActivityFeedProps {
    activities: AgentActivity[];
    isLoading?: boolean;
}

interface DetailedActivity extends AgentActivity {
    skillsUsed?: string[];
    documentsIdentified?: string[];
    alerts?: Array<{ severity: 'info' | 'warning' | 'critical'; message: string }>;
}

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({ activities, isLoading }) => {
    const [expandedActivity, setExpandedActivity] = useState<number | null>(null);

    if (!activities || activities.length === 0) {
        return (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <Terminal className="text-slate-300 mb-3" size={32} />
                <p className="text-sm font-medium text-slate-500">No agent activity recorded for this session.</p>
                <p className="text-xs text-slate-400 mt-1">Summoning sub-agents during document analysis...</p>
            </div>
        );
    }

    const toggleExpand = (idx: number) => {
        setExpandedActivity(expandedActivity === idx ? null : idx);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <div className="p-1.5 bg-fuchsia-500 rounded-lg">
                        <Brain size={16} className="text-white" />
                    </div>
                    <h3 className="font-bold text-sm tracking-tight">Collaborative Brain Feed</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Pulse</span>
                </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {activities.map((activity, idx) => {
                    const isExpanded = expandedActivity === idx;
                    const detailedActivity = activity as DetailedActivity;
                    
                    return (
                        <div key={idx} className="p-4 hover:bg-slate-50 transition-colors group">
                            <div 
                                className="flex items-start gap-4 cursor-pointer"
                                onClick={() => toggleExpand(idx)}
                            >
                                <div className={`mt-0.5 p-2 rounded-xl ${activity.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                    {activity.status === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Bot size={14} className="text-fuchsia-500" />
                                            <h4 className="text-sm font-bold text-slate-900 truncate">
                                                {activity.agentName}
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                            {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 italic">
                                        "{activity.summary}"
                                    </p>

                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${activity.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {activity.status === 'success' ? 'Completed' : 'Failed'}
                                        </span>
                                        {activity.documentId && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase flex items-center gap-1">
                                                <FileText size={10} className="text-slate-300" />
                                                {activity.documentId}
                                            </span>
                                        )}
                                        {detailedActivity.documentsIdentified && detailedActivity.documentsIdentified.length > 0 && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 uppercase flex items-center gap-1">
                                                <List size={10} />
                                                {detailedActivity.documentsIdentified.length} docs
                                            </span>
                                        )}
                                        {detailedActivity.alerts && detailedActivity.alerts.length > 0 && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                                                detailedActivity.alerts.some(a => a.severity === 'critical') 
                                                    ? 'bg-red-100 text-red-700' 
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                <AlertTriangle size={10} />
                                                {detailedActivity.alerts.length} alerts
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="mt-3 pl-12 pr-4 pb-2 space-y-3 border-l-2 border-fuchsia-200 ml-6">
                                    {/* Skills Used */}
                                    {detailedActivity.skillsUsed && detailedActivity.skillsUsed.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Skills Used</p>
                                            <div className="flex flex-wrap gap-1">
                                                {detailedActivity.skillsUsed.map((skill, sidx) => (
                                                    <span key={sidx} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                                        <Sparkles size={8} className="inline mr-1" />
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Documents Identified */}
                                    {detailedActivity.documentsIdentified && detailedActivity.documentsIdentified.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Documents Required</p>
                                            <ul className="space-y-1">
                                                {detailedActivity.documentsIdentified.map((doc, didx) => (
                                                    <li key={didx} className="text-xs text-fuchsia-700 flex items-center gap-1">
                                                        <ChevronRight size={10} />
                                                        {doc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Alerts */}
                                    {detailedActivity.alerts && detailedActivity.alerts.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alerts</p>
                                            <div className="space-y-1">
                                                {detailedActivity.alerts.map((alert, aidx) => (
                                                    <div key={aidx} className={`text-xs p-2 rounded flex items-start gap-1 ${
                                                        alert.severity === 'critical' 
                                                            ? 'bg-red-50 text-red-700 border border-red-100' 
                                                            : alert.severity === 'warning'
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    }`}>
                                                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                                        {alert.message}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Full Response */}
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Response</p>
                                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-line">
                                            {activity.summary}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                <button className="text-[10px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors">
                    View Detailed Reasoning Trace
                </button>
            </div>
        </div >
    );
};
