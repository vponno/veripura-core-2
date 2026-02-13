import React from 'react';
import { ChecklistItem as ChecklistItemType, ChecklistItemStatus } from '../../types';
import { Upload, XCircle, Truck, Building2, ShieldCheck, Info } from 'lucide-react';

interface ChecklistItemCardProps {
    item: ChecklistItemType;
    onUpdate?: (id: string, status: ChecklistItemStatus) => void;
    onDelete?: (id: string) => void;
    onUpload?: (file: File) => void;
    isAdvised?: boolean;
}

const getCategoryColors = (category: string | undefined) => {
    if (!category) return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
    const hash = category.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const colors = [
        { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
        { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
        { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
        { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    ];
    return colors[Math.abs(hash) % colors.length];
};

export const ChecklistItemCard: React.FC<ChecklistItemCardProps> = ({
    item,
    onUpdate,
    onDelete,
    onUpload,
    isAdvised = false
}) => {
    const categoryColors = getCategoryColors(item.category);

    return (
        <div className={`rounded-2xl p-5 border transition-all relative group ${isAdvised
            ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
            : 'bg-white border-rose-100 shadow-sm hover:shadow-md'
            }`}>
            {/* Delete Action (Advised Only) */}
            {isAdvised && onDelete && (
                <button
                    onClick={() => onDelete(item.id || item.documentName)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Remove from checklist"
                >
                    <XCircle size={18} />
                </button>
            )}

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pr-6">
                {/* Content */}
                <div className="flex-1">
                    {/* Header Badges */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${categoryColors.bg} ${categoryColors.text} ${categoryColors.border}`}>
                            {item.category || 'CUSTOMS'}
                        </span>

                        {!isAdvised ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md">
                                <ShieldCheck size={12} /> MANDATORY
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md">
                                <Info size={12} /> ADVISED
                            </span>
                        )}
                    </div>

                    <h4 className="font-bold text-slate-800 text-lg mb-1">{item.documentName}</h4>
                    {item.description && (
                        <p className="text-sm text-slate-500 mb-4 leading-relaxed max-w-xl">
                            {item.description}
                        </p>
                    )}

                    {/* Specialist Inspectors (Audit Trail) */}
                    {(item as any).analysis?.agentAuditTrail && (item as any).analysis.agentAuditTrail.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(item as any).analysis.agentAuditTrail.map((activity: any, idx: number) => (
                                <div
                                    key={idx}
                                    title={activity.summary}
                                    className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-700"
                                >
                                    <ShieldCheck size={10} />
                                    {activity.agentName}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                        <div className="flex items-center gap-1.5">
                            {item.category === 'Transport' ? <Truck size={14} /> : <Building2 size={14} />}
                            <span>{item.issuingAgency || 'Authority'}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-2 sm:mt-0 ml-0 sm:ml-4 flex flex-col gap-2 items-end">
                    {/* Render AI Actions if available (Heal flows) */}
                    {item.status === ChecklistItemStatus.PENDING_REVIEW && item.analysis?.alerts?.map((alert: any) =>
                        alert.actions?.map((action: any) => (
                            <button
                                key={action.id}
                                onClick={() => onUpdate?.(item.id, ChecklistItemStatus.READY)} // Simulating logic for now
                                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm group"
                            >
                                <ShieldCheck size={14} className="text-emerald-400" />
                                <span>{action.label}</span>
                            </button>
                        ))
                    )}

                    {onUpload && (
                        <label className="cursor-pointer group flex items-center gap-2 border border-slate-200 bg-white hover:bg-fuchsia-50 hover:border-fuchsia-200 rounded-xl px-4 py-2.5 transition-all shadow-sm">
                            <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-fuchsia-100 group-hover:text-fuchsia-600 transition-colors">
                                <Upload size={16} />
                            </div>
                            <span className="text-sm font-bold text-slate-600 group-hover:text-fuchsia-700">Upload</span>
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
};

