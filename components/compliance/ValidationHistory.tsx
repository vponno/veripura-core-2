import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ValidationHistoryEntry {
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
}

interface ValidationHistoryProps {
    history: ValidationHistoryEntry[];
    onRunValidation?: () => void;
    isRunning?: boolean;
}

export const ValidationHistory: React.FC<ValidationHistoryProps> = ({ 
    history, 
    onRunValidation,
    isRunning 
}) => {
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getStatusIcon = (status: 'valid' | 'flagged') => {
        if (status === 'valid') {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        }
        return <XCircle className="w-5 h-5 text-red-500" />;
    };

    const getEventBadge = (eventType: string) => {
        const styles = {
            upload: 'bg-blue-100 text-blue-700',
            scheduled: 'bg-purple-100 text-purple-700',
            manual: 'bg-amber-100 text-amber-700'
        };
        return (
            <span className={`text-xs px-2 py-0.5 rounded-full ${styles[eventType as keyof typeof styles] || 'bg-gray-100'}`}>
                {eventType}
            </span>
        );
    };

    const latestValidation = history[0];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-700">Consistency Validator</h3>
                </div>
                {onRunValidation && (
                    <button
                        onClick={onRunValidation}
                        disabled={isRunning}
                        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            isRunning 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                    >
                        <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                        {isRunning ? 'Running...' : 'Run Check'}
                    </button>
                )}
            </div>

            {/* Latest Status Summary */}
            {latestValidation ? (
                <div className={`px-4 py-3 ${
                    latestValidation.status === 'valid' 
                        ? 'bg-green-50 border-b border-green-100' 
                        : 'bg-red-50 border-b border-red-100'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {getStatusIcon(latestValidation.status)}
                            <div>
                                <p className={`font-medium ${
                                    latestValidation.status === 'valid' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                    {latestValidation.status === 'valid' ? 'All Checks Passed' : 'Issues Detected'}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {formatTime(latestValidation.timestamp)}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1">
                                {latestValidation.backwardValid ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                )}
                                <span className="text-slate-600">Backward: {latestValidation.backwardValid ? 'OK' : `${latestValidation.conflictCount} conflicts`}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {latestValidation.forwardValid ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                )}
                                <span className="text-slate-600">Forward: {latestValidation.forwardValid ? 'OK' : `${latestValidation.gapCount} gaps`}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="px-4 py-8 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No validation history yet</p>
                    <p className="text-sm">Run a consistency check to start tracking</p>
                </div>
            )}

            {/* History List */}
            {history.length > 1 && (
                <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-slate-500">Time</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-500">Document</th>
                                <th className="px-4 py-2 text-left font-medium text-slate-500">Type</th>
                                <th className="px-4 py-2 text-center font-medium text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.slice(1).map((entry) => (
                                <tr key={entry.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 text-slate-600">
                                        {formatTime(entry.timestamp)}
                                    </td>
                                    <td className="px-4 py-2 text-slate-700">
                                        {entry.documentType || '-'}
                                    </td>
                                    <td className="px-4 py-2">
                                        {getEventBadge(entry.eventType)}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        {getStatusIcon(entry.status)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {history.length === 0 && (
                <div className="px-4 py-8 text-center">
                    <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-600 font-medium">No validation history</p>
                    <p className="text-sm text-slate-400 mt-1">
                        Consistency checks will appear here after each document upload or manual trigger
                    </p>
                </div>
            )}
        </div>
    );
};
