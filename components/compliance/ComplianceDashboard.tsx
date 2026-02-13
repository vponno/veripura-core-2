import React, { useState } from 'react';
import { 
    Bot, 
    ShieldCheck, 
    ShieldAlert, 
    FileText, 
    ChevronRight, 
    ChevronDown,
    CheckCircle2,
    AlertCircle,
    List,
    Sparkles,
    Activity
} from 'lucide-react';
import { AgentActivity } from '../../types';

interface ComplianceDashboardProps {
    activities: AgentActivity[];
    validationHistory?: any[];
    roadmap: Record<string, any>;
    pendingDocs: any[];
}

interface DetailedActivity extends AgentActivity {
    skillsUsed?: string[];
    documentsIdentified?: string[];
    alerts?: Array<{ severity: 'info' | 'warning' | 'critical'; message: string }>;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ 
    activities, 
    validationHistory,
    roadmap,
    pendingDocs 
}) => {
    const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
    const [showAllActivity, setShowAllActivity] = useState(false);

    const toggleAgent = (agentId: string) => {
        const newSet = new Set(expandedAgents);
        if (newSet.has(agentId)) {
            newSet.delete(agentId);
        } else {
            newSet.add(agentId);
        }
        setExpandedAgents(newSet);
    };

    const guardianDocs = Object.entries(roadmap).filter(([_, data]: [string, any]) => 
        data.addedBy === 'guardian_agent'
    );

    const hasActivity = activities && activities.length > 0;
    const hasGuardianResults = guardianDocs.length > 0;

    // Get latest validation
    const latestValidation = validationHistory?.[0];

    if (!hasActivity && !hasGuardianResults && pendingDocs.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-slate-900 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-fuchsia-500 rounded-xl">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Guardian Agent Analysis</h3>
                            <p className="text-xs text-slate-400">
                                {hasActivity ? `${activities.length} specialists analyzed your shipment` : 'Analysis in progress...'}
                            </p>
                        </div>
                    </div>
                    {latestValidation && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                            latestValidation.status === 'valid' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-amber-500/20 text-amber-400'
                        }`}>
                            {latestValidation.status === 'valid' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                                <AlertCircle className="w-3.5 h-3.5" />
                            )}
                            {latestValidation.status === 'valid' ? 'All Checks Passed' : 'Review Required'}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-5 space-y-6">
                {/* Specialist Activity */}
                {hasActivity && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-slate-600" />
                                <h4 className="font-bold text-slate-900 text-sm">Specialist Analysis Details</h4>
                            </div>
                            {activities.length > 3 && (
                                <button 
                                    onClick={() => setShowAllActivity(!showAllActivity)}
                                    className="text-xs text-fuchsia-600 hover:text-fuchsia-700 font-medium"
                                >
                                    {showAllActivity ? 'Show Less' : `Show All (${activities.length})`}
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {(showAllActivity ? activities : activities.slice(0, 3)).map((activity, idx) => {
                                const detailed = activity as DetailedActivity;
                                const isExpanded = expandedAgents.has(activity.agentId);
                                
                                return (
                                    <div 
                                        key={idx} 
                                        className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-fuchsia-200 transition-colors"
                                    >
                                        <button
                                            onClick={() => toggleAgent(activity.agentId)}
                                            className="w-full px-4 py-3 flex items-center justify-between text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-lg ${
                                                    activity.status === 'success' 
                                                        ? 'bg-emerald-100 text-emerald-600' 
                                                        : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {activity.status === 'success' ? (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    ) : (
                                                        <AlertCircle className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">{activity.agentName}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{activity.summary}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {detailed.documentsIdentified && detailed.documentsIdentified.length > 0 && (
                                                    <span className="text-xs bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full">
                                                        {detailed.documentsIdentified.length} docs
                                                    </span>
                                                )}
                                                {detailed.alerts && detailed.alerts.length > 0 && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        detailed.alerts.some(a => a.severity === 'critical')
                                                            ? 'bg-red-100 text-red-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {detailed.alerts.length} alerts
                                                    </span>
                                                )}
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
                                                <div className="space-y-3">
                                                    {detailed.skillsUsed && detailed.skillsUsed.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Skills Used</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {detailed.skillsUsed.map((skill, sidx) => (
                                                                    <span key={sidx} className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-full">
                                                                        <Sparkles className="w-3 h-3 inline mr-1" />
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {detailed.documentsIdentified && detailed.documentsIdentified.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Documents Found</p>
                                                            <ul className="space-y-1">
                                                                {detailed.documentsIdentified.map((doc, didx) => (
                                                                    <li key={didx} className="text-xs text-slate-700 flex items-center gap-1">
                                                                        <ChevronRight className="w-3 h-3 text-fuchsia-500" />
                                                                        {doc}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {detailed.alerts && detailed.alerts.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alerts</p>
                                                            <div className="space-y-1">
                                                                {detailed.alerts.map((alert, aidx) => (
                                                                    <div key={aidx} className={`text-xs p-2 rounded flex items-start gap-1.5 ${
                                                                        alert.severity === 'critical' 
                                                                            ? 'bg-red-100 text-red-700' 
                                                                            : alert.severity === 'warning'
                                                                                ? 'bg-amber-100 text-amber-700'
                                                                                : 'bg-blue-100 text-blue-700'
                                                                    }`}>
                                                                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                                                                        {alert.message}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="pt-2 border-t border-slate-200">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Report</p>
                                                        <p className="text-xs text-slate-600 whitespace-pre-line">{activity.summary}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Validation Summary */}
                {latestValidation && (
                    <div className={`rounded-xl p-4 border ${
                        latestValidation.status === 'valid'
                            ? 'bg-emerald-50 border-emerald-100'
                            : 'bg-amber-50 border-amber-100'
                    }`}>
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className={`w-4 h-4 ${
                                latestValidation.status === 'valid' ? 'text-emerald-600' : 'text-amber-600'
                            }`} />
                            <h4 className={`font-bold text-sm ${
                                latestValidation.status === 'valid' ? 'text-emerald-900' : 'text-amber-900'
                            }`}>
                                Consistency Check
                            </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`rounded-lg p-3 ${
                                latestValidation.backwardValid ? 'bg-emerald-100/50' : 'bg-red-100/50'
                            }`}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Backward Check</p>
                                <p className={`text-sm font-medium ${
                                    latestValidation.backwardValid ? 'text-emerald-700' : 'text-red-700'
                                }`}>
                                    {latestValidation.backwardValid ? '✓ Consistent' : `${latestValidation.conflictCount} conflicts`}
                                </p>
                            </div>
                            <div className={`rounded-lg p-3 ${
                                latestValidation.forwardValid ? 'bg-emerald-100/50' : 'bg-amber-100/50'
                            }`}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Forward Check</p>
                                <p className={`text-sm font-medium ${
                                    latestValidation.forwardValid ? 'text-emerald-700' : 'text-amber-700'
                                }`}>
                                    {latestValidation.forwardValid ? '✓ Complete' : `${latestValidation.gapCount} gaps`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
