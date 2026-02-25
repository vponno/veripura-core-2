import React from 'react';
import { ArrowRight, FileCheck } from 'lucide-react';
import { Consignment } from '../../services/consignmentService';

interface ConsignmentProgressProps {
    consignment: Consignment;
    onClick: () => void;
}

const ConsignmentProgress: React.FC<ConsignmentProgressProps> = ({ consignment, onClick }) => {
    const completedDocs = Object.values(consignment.roadmap || {}).filter(d => d.status === 'Validated').length;
    const totalDocs = Object.keys(consignment.roadmap || {}).length;
    const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

    return (
        <div
            onClick={onClick}
            className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm dark:hover:shadow-md hover:border-blue-500/20 dark:hover:border-blue-500/30 transition-all cursor-pointer"
        >
            <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{consignment.exportFrom}</span>
                    <ArrowRight size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{consignment.importTo}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">#{consignment.id?.slice(0, 6)}</span>
                    <span>•</span>
                    <span>{new Date(consignment.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1 w-32">
                <div className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <FileCheck size={12} className={progress === 100 ? 'text-emerald-500' : 'text-blue-600 dark:text-blue-400'} />
                    <span>{progress}% Ready</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600 dark:bg-blue-400'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ConsignmentProgress;
