import React from 'react';
import {
    CheckCircle,
    XCircle,
    FileText,
    Upload,
    Bot,
    ExternalLink,
    ShieldAlert,
    Info,
    ChevronRight,
    Lock,
    Sparkles,
    ShieldCheck,
    Truck
} from 'lucide-react';

interface DocumentItem {
    name: string;
    status: string;
    category?: string;
    required?: boolean;
    addedBy?: string;
    description?: string;
    agencyLink?: string;
    issuingAgency?: string;
    isMandatory?: boolean;
    fileUrl?: string;
    iotaExplorerUrl?: string;
    iotaTxHash?: string;
    iotaTxCost?: string;
    iotaError?: string;
    analysis?: any;
}

interface UnifiedDocumentListProps {
    documents: DocumentItem[];
    onUpload: (docName: string, file: File) => void;
    onPreview: (docName: string, docData?: any) => void;
    onApprove?: (docName: string, docData?: any) => void;
    onReject?: (docName: string, docData?: any) => void;
}

export const UnifiedDocumentList: React.FC<UnifiedDocumentListProps> = ({
    documents,
    onUpload,
    onPreview,
    onApprove,
    onReject
}) => {
    const [expandedChecks, setExpandedChecks] = React.useState<Record<string, boolean>>({});

    const toggleChecks = (docName: string) => {
        setExpandedChecks(prev => ({
            ...prev,
            [docName]: !prev[docName]
        }));
    };

    if (!documents || documents.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No documents required yet</p>
                <p className="text-xs mt-1">Upload a Purchase Order to generate requirements</p>
            </div>
        );
    }

    // Category Mapping & Sorting
    const categoriesOrder = ['Commercial', 'Certificates', 'Regulatory', 'Other'];

    const categorizeDoc = (doc: DocumentItem) => {
        if (doc.category && categoriesOrder.includes(doc.category)) return doc.category;
        const name = doc.name.toLowerCase();
        if (name.includes('invoice') || name.includes('packing list') || name.includes('purchase order') || name.includes('contract')) return 'Commercial';
        if (name.includes('certificate') || name.includes('organic') || name.includes('phytosanitary') || name.includes('health') || name.includes('origin') || name.includes('analysis')) return 'Certificates';
        if (name.includes('bill of lading') || name.includes('air waybill') || name.includes('declaration') || name.includes('permit') || name.includes('license') || name.includes('waybill') || name.includes('eur.1')) return 'Regulatory';
        return 'Other';
    };

    const categorizedDocs = documents.reduce((acc: Record<string, DocumentItem[]>, doc) => {
        const cat = categorizeDoc(doc);

        // Ensure issuingAgency is populated if missing
        const document = { ...doc };
        if (!document.issuingAgency) {
            // Import complianceService dynamically or use its logic
            // Since we can't easily import it here without potential circular deps 
            // if we are not careful, we'll rely on the parent providing it or 
            // use a simplified version of the mapping logic.
            // But RegisterConsignment is already providing it now.
        }

        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(document);
        return acc;
    }, {});

    const renderDocumentCard = (doc: DocumentItem) => {
        const isGuardian = doc.addedBy === 'guardian_agent';
        const isRequired = doc.required || doc.isMandatory;

        // Determine icon and colors based on status and category
        let icon = <FileText size={20} />;
        let iconBg = 'bg-slate-100 text-slate-400';

        if (doc.status === 'Validated') {
            icon = <CheckCircle size={20} />;
            iconBg = 'bg-emerald-100 text-emerald-600';
        } else if (doc.status === 'Rejected') {
            icon = <XCircle size={20} />;
            iconBg = 'bg-red-100 text-red-600';
        } else if (doc.status === 'Pending Review') {
            icon = <Sparkles size={20} />;
            iconBg = 'bg-amber-100 text-amber-600';
        } else if (doc.category === 'Food Safety') {
            icon = <ShieldCheck size={20} />;
            iconBg = 'bg-blue-100 text-blue-600';
        } else if (doc.category === 'Organic') {
            icon = <Sparkles size={20} />;
            iconBg = 'bg-green-100 text-green-600';
        } else if (doc.category === 'Transport') {
            icon = <Truck size={20} />;
            iconBg = 'bg-orange-100 text-orange-600';
        }

        return (
            <div
                key={doc.name}
                className={`border rounded-xl p-4 transition-all hover:shadow-md ${isRequired
                    ? 'border-red-200 bg-red-50/30'
                    : isGuardian
                        ? 'border-fuchsia-200 bg-fuchsia-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
            >
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-full shrink-0 ${iconBg}`}>
                        {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                {/* Title row */}
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-900">{doc.name}</h4>

                                    {/* Badges */}
                                    {isRequired && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                                            Required
                                        </span>
                                    )}
                                    {doc.status === 'Validated' && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200">
                                            ✓ Validated
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {doc.description && (
                                    <p className="text-xs text-slate-600 mb-2">{doc.description}</p>
                                )}

                                {/* Meta info: Verified by & Category */}
                                <div className="flex items-center gap-2 mb-2">
                                    {(doc.issuingAgency || (doc.analysis?.agentAuditTrail && doc.analysis.agentAuditTrail.length > 0)) && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 uppercase tracking-tight">
                                            <Bot size={11} strokeWidth={3} />
                                            <span>Verified by {doc.issuingAgency || doc.analysis?.agentAuditTrail?.[0]?.agentName || 'Guardian Specialist'}</span>
                                        </div>
                                    )}
                                    {doc.category && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-tight">
                                            {doc.category}
                                        </span>
                                    )}
                                </div>

                                {/* Status message */}
                                <div className="flex items-center gap-2 mt-2 text-[11px]">
                                    {doc.status === 'Validated' ? (
                                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                            <CheckCircle size={12} />
                                            <span>Encrypted, stored & anchored to blockchain</span>
                                        </div>
                                    ) : doc.status === 'Pending Review' ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-200 w-fit">
                                                <Info size={12} />
                                                <span>Awaiting human review</span>
                                            </div>
                                            {doc.analysis?.reviewReason && (
                                                <p className="text-[11px] text-amber-700 font-medium bg-amber-50/50 p-2 rounded-lg border border-amber-100 italic leading-tight">
                                                    <span className="font-bold uppercase text-[9px] block mb-0.5 text-amber-500 not-italic">Review Required Because:</span>
                                                    {doc.analysis.reviewReason}
                                                </p>
                                            )}
                                        </div>
                                    ) : doc.status === 'Rejected' ? (
                                        <div className="flex items-center gap-1.5 text-red-600 font-medium">
                                            <XCircle size={12} />
                                            <span>Validation failed - re-upload required</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                                            <div className="w-4 h-4 rounded bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
                                                <Upload size={10} />
                                            </div>
                                            <span>Waiting for upload</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 shrink-0">
                                {doc.status === 'Validated' || doc.status === 'Pending Review' ? (
                                    <>
                                        <button
                                            onClick={() => onPreview(doc.name, doc)}
                                            className="text-xs bg-slate-100 text-slate-700 px-3 py-2 rounded-lg border border-slate-200 font-medium hover:bg-slate-200 flex items-center gap-1.5 whitespace-nowrap"
                                        >
                                            <Lock size={12} />
                                            {doc.status === 'Pending Review' ? 'Review' : 'View'}
                                        </button>

                                        {doc.iotaError && doc.status === 'Validated' && (
                                            <div className="flex flex-col gap-1 mt-1">
                                                <span className="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 flex items-center gap-1 leading-tight">
                                                    <XCircle size={10} /> {doc.iotaError}
                                                </span>
                                                {doc.iotaError.toLowerCase().includes('balance') || doc.iotaError.toLowerCase().includes('coin') || doc.iotaError.toLowerCase().includes('fund') ? (
                                                    <a
                                                        href="https://faucet.testnet.iota.cafe"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] bg-slate-800 text-white px-2 py-1.5 rounded font-medium hover:bg-slate-700 text-center"
                                                    >
                                                        Fund Wallet via Faucet
                                                    </a>
                                                ) : null}
                                            </div>
                                        )}

                                        {doc.iotaExplorerUrl && doc.status === 'Validated' && (
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={doc.iotaExplorerUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100 font-medium hover:bg-blue-100 flex items-center gap-1.5 whitespace-nowrap"
                                                >
                                                    <ExternalLink size={12} /> Proof
                                                </a>
                                                {doc.iotaTxCost && (
                                                    <span className="text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                                        Cost: {doc.iotaTxCost} IOTA
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {doc.agencyLink && doc.agencyLink !== 'N/A' && (
                                            <a
                                                href={doc.agencyLink.startsWith('http') ? doc.agencyLink : `https://${doc.agencyLink}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100 font-medium hover:bg-emerald-100 flex items-center gap-1.5 whitespace-nowrap"
                                            >
                                                <ExternalLink size={12} /> Get Form
                                            </a>
                                        )}

                                        {/* Approve/Reject for Pending Review */}
                                        {doc.status === 'Pending Review' && onApprove && onReject && (
                                            <div className="flex gap-1 mt-1">
                                                <button
                                                    onClick={() => onApprove(doc.name, doc)}
                                                    className="flex-1 text-xs bg-emerald-500 text-white px-2 py-1.5 rounded font-medium hover:bg-emerald-600"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => onReject(doc.name, doc)}
                                                    className="flex-1 text-xs bg-red-500 text-white px-2 py-1.5 rounded font-medium hover:bg-red-600"
                                                >
                                                    ✗
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : doc.status === 'Rejected' ? (
                                    <label className="cursor-pointer px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 flex items-center gap-1.5 whitespace-nowrap">
                                        Re-upload
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && onUpload(doc.name, e.target.files[0])}
                                        />
                                    </label>
                                ) : (
                                    <>
                                        <label className="cursor-pointer px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                                            <Upload size={12} />
                                            Upload
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => e.target.files?.[0] && onUpload(doc.name, e.target.files[0])}
                                            />
                                        </label>

                                        {doc.agencyLink && doc.agencyLink !== 'N/A' && (
                                            <a
                                                href={doc.agencyLink.startsWith('http') ? doc.agencyLink : `https://${doc.agencyLink}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100 font-medium hover:bg-emerald-100 flex items-center gap-1.5 whitespace-nowrap"
                                            >
                                                <ExternalLink size={12} /> Get Form
                                            </a>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Analysis preview for validated docs */}
                        {(doc.status === 'Validated' || doc.status === 'Pending Review') && doc.analysis && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                    <strong className="text-slate-700">AI Analysis:</strong> {doc.status === 'Pending Review' ? (doc.analysis.aiSummary || 'Document processed - flagged for human verification') : (doc.analysis.aiSummary || 'Document processed successfully')}
                                </p>

                                {/* Intelligent Specialist Findings */}
                                {(() => {
                                    const relevantFindings = doc.analysis.agentAuditTrail?.filter((log: any) => {
                                        const content = log.details || log.summary || "";
                                        return content.length > 0 &&
                                            !content.includes("Analysis Pending") &&
                                            !content.includes("No specific") &&
                                            !content.includes("required for duty calculation"); // Filter out empty tariff reports
                                    }) || [];

                                    if (relevantFindings.length === 0) return null;

                                    const alerts = relevantFindings.filter((f: any) => f.action === 'ISSUE_FOUND');
                                    const verified = relevantFindings.filter((f: any) => f.action !== 'ISSUE_FOUND');
                                    const isExpanded = expandedChecks[doc.name];

                                    return (
                                        <div className="space-y-1.5 mt-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <Bot size={12} /> Specialist Findings
                                                </div>
                                                {verified.length > 0 && (
                                                    <button
                                                        onClick={() => toggleChecks(doc.name)}
                                                        className="text-[10px] font-bold text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1"
                                                    >
                                                        {isExpanded ? 'Hide' : 'Show'} {verified.length} Verified {verified.length === 1 ? 'Check' : 'Checks'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Alerts (Always Visible) */}
                                            {alerts.map((log: any, idx: number) => (
                                                <div key={`alert-${idx}`} className="flex gap-2 text-[11px] bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-200">
                                                    <div className="shrink-0 mt-0.5">
                                                        <ShieldAlert size={12} className="text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold">{log.agentName || 'Specialist'}: </span>
                                                        {log.details || log.summary}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Verified (Toggleable) */}
                                            {isExpanded && verified.map((log: any, idx: number) => (
                                                <div key={`verified-${idx}`} className="flex gap-2 text-[11px] bg-emerald-50/50 text-emerald-800 p-2 rounded-lg border border-emerald-100/50 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <div className="shrink-0 mt-0.5">
                                                        <ShieldCheck size={12} className="text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold opacity-70">{log.agentName || 'Specialist'}: </span>
                                                        {log.details || log.summary}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-10">
            {categoriesOrder.map(category => {
                const docs = categorizedDocs[category] || [];
                if (docs.length === 0) return null;

                // Sort documents within category: Rejected > Pending Review > Pending > Validated
                const sortedDocs = [...docs].sort((a, b) => {
                    const statusOrder: Record<string, number> = { 'Rejected': 0, 'Pending Review': 1, 'Pending': 2, 'Validated': 3 };
                    const aStatus = a.status || 'Pending';
                    const bStatus = b.status || 'Pending';
                    return (statusOrder[aStatus] ?? 2) - (statusOrder[bStatus] ?? 2);
                });

                return (
                    <div key={category} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className={`w-1 h-6 rounded-full ${category === 'Commercial' ? 'bg-blue-500' :
                                    category === 'Certificates' ? 'bg-emerald-500' :
                                        category === 'Regulatory' ? 'bg-purple-500' : 'bg-slate-400'
                                    }`} />
                                <h4 className="font-bold text-slate-800 tracking-tight">{category} ({docs.length})</h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Roadmap Section</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {sortedDocs.map(renderDocumentCard)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
