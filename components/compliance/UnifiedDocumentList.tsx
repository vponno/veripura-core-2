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
    if (!documents || documents.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No documents required yet</p>
                <p className="text-xs mt-1">Upload a Purchase Order to generate requirements</p>
            </div>
        );
    }

    // Group documents by status priority: Pending > Pending Review > Validated > Rejected
    const pending = documents.filter(d => !d.status || d.status === 'Pending');
    const reviewing = documents.filter(d => d.status === 'Pending Review');
    const validated = documents.filter(d => d.status === 'Validated');
    const rejected = documents.filter(d => d.status === 'Rejected');

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
                                    {isGuardian && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-600 border border-fuchsia-200 flex items-center gap-1">
                                            <Bot size={10} /> GUARDIAN IDENTIFIED
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

                                {/* Meta info */}
                                <div className="flex items-center gap-3 text-xs">
                                    {doc.issuingAgency && (
                                        <span className="text-slate-500 flex items-center gap-1">
                                            {/* Use Bot icon if it looks like an agent, otherwise bank/institution icon */}
                                            {doc.issuingAgency.includes('Agent') ||
                                                doc.issuingAgency.includes('Guardian') ||
                                                doc.issuingAgency.includes('Specialist') ||
                                                doc.issuingAgency.includes('Auditor') ||
                                                doc.issuingAgency.includes('Validator') ||
                                                doc.issuingAgency.includes('Expert') ||
                                                doc.issuingAgency.includes('Sentry') ||
                                                doc.issuingAgency.includes('Optimizer') ||
                                                doc.issuingAgency.includes('Advisor') ||
                                                doc.issuingAgency.includes('Inspector') ||
                                                doc.issuingAgency.includes('Watcher') ||
                                                doc.issuingAgency.includes('Diplomat') ||
                                                doc.issuingAgency.includes('Interpreter') ||
                                                doc.issuingAgency.includes('Scout') ||
                                                doc.issuingAgency.includes('Guard') ||
                                                doc.issuingAgency.includes('Checkpoint') ? (
                                                <Bot size={12} className="text-fuchsia-600" />
                                            ) : (
                                                <span>🏛️</span>
                                            )}
                                            {doc.issuingAgency.includes('Agent') ||
                                                doc.issuingAgency.includes('Guardian') ||
                                                doc.issuingAgency.includes('Specialist') ||
                                                doc.issuingAgency.includes('Auditor') ||
                                                doc.issuingAgency.includes('Validator') ||
                                                doc.issuingAgency.includes('Expert') ||
                                                doc.issuingAgency.includes('Sentry') ||
                                                doc.issuingAgency.includes('Optimizer') ||
                                                doc.issuingAgency.includes('Advisor') ||
                                                doc.issuingAgency.includes('Inspector') ||
                                                doc.issuingAgency.includes('Watcher') ||
                                                doc.issuingAgency.includes('Diplomat') ||
                                                doc.issuingAgency.includes('Interpreter') ||
                                                doc.issuingAgency.includes('Scout') ||
                                                doc.issuingAgency.includes('Guard') ||
                                                doc.issuingAgency.includes('Checkpoint') ? (
                                                <span className="text-fuchsia-700 font-medium">Verified by {doc.issuingAgency}</span>
                                            ) : (
                                                <span>{doc.issuingAgency}</span>
                                            )}
                                        </span>
                                    )}
                                    {doc.category && (
                                        <span className={`px-2 py-0.5 rounded-full ${doc.category === 'Food Safety' ? 'bg-blue-50 text-blue-600' :
                                            doc.category === 'Customs' ? 'bg-purple-50 text-purple-600' :
                                                doc.category === 'Organic' ? 'bg-green-50 text-green-600' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {doc.category}
                                        </span>
                                    )}
                                </div>

                                {/* Status message */}
                                <p className="text-xs text-slate-500 mt-2">
                                    {doc.status === 'Validated' ? '✓ Encrypted, stored & anchored to blockchain' :
                                        doc.status === 'Pending Review' ? '⚠ Awaiting human review' :
                                            doc.status === 'Rejected' ? '✗ Validation failed - re-upload required' :
                                                '📤 Waiting for upload'}
                                </p>
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
                        {doc.status === 'Validated' && doc.analysis && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 line-clamp-2">
                                    <strong>AI Analysis:</strong> {doc.analysis.aiSummary || 'Document processed successfully'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Validated Documents (Moved to Top) */}
            {validated.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-bold text-emerald-700">Validated ({validated.length})</h4>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            Encrypted & Anchored
                        </span>
                    </div>
                    <div className="space-y-3">
                        {validated.map(renderDocumentCard)}
                    </div>
                </div>
            )}

            {/* Pending Documents */}
            {pending.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="w-5 h-5 text-red-600" />
                        <h4 className="font-bold text-red-700">Action Required ({pending.length})</h4>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            Upload these documents to proceed
                        </span>
                    </div>
                    <div className="space-y-3">
                        {pending.map(renderDocumentCard)}
                    </div>
                </div>
            )}

            {/* Pending Review */}
            {reviewing.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                        <h4 className="font-bold text-amber-700">Pending Review ({reviewing.length})</h4>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            Awaiting approval
                        </span>
                    </div>
                    <div className="space-y-3">
                        {reviewing.map(renderDocumentCard)}
                    </div>
                </div>
            )}

            {/* Rejected Documents */}
            {rejected.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <h4 className="font-bold text-red-700">Rejected ({rejected.length})</h4>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            Re-upload required
                        </span>
                    </div>
                    <div className="space-y-3">
                        {rejected.map(renderDocumentCard)}
                    </div>
                </div>
            )}
        </div>
    );
};
