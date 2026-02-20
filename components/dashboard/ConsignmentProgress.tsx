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
            className="group flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer"
        >
            <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-900 truncate">{consignment.exportFrom}</span>
                    <ArrowRight size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-900 truncate">{consignment.importTo}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">#{consignment.id?.slice(0, 6)}</span>
                    <span>•</span>
                    <span>{new Date(consignment.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="flex flex-col items-end gap-1 w-32">
                <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                    <FileCheck size={12} className={progress === 100 ? 'text-green-500' : 'text-primary'} />
                    <span>{progress}% Ready</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-primary'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ConsignmentProgress;
