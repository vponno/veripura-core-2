import React from 'react';
import {
    CheckCircle,
    XCircle,
    Sparkles,
    ShieldCheck,
    FileText,
    Truck,
    Lock,
    ExternalLink
} from 'lucide-react';

export const RoadmapCard = ({ docName, data, handlePreview, handleFileSelect, consignmentId, onApprove, onReject }: any) => {
    return (
        <div className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${data.status === 'Validated' ? 'bg-emerald-100 text-emerald-600' :
                        data.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                            data.category === 'Organic' ? 'bg-green-50 text-green-600' :
                                data.category === 'Food Safety' ? 'bg-blue-50 text-blue-600' :
                                    data.category === 'Customs' ? 'bg-purple-50 text-purple-600' :
                                        data.category === 'Transport' ? 'bg-orange-50 text-orange-600' :
                                            'bg-slate-100 text-slate-400'
                        }`}>
                        {
                            data.status === 'Validated' ? <CheckCircle size={20} /> :
                                data.status === 'Rejected' ? <XCircle size={20} /> :
                                    data.category === 'Organic' ? <Sparkles size={20} /> :
                                        data.category === 'Food Safety' ? <ShieldCheck size={20} /> :
                                            data.category === 'Customs' ? <FileText size={20} /> :
                                                data.category === 'Transport' ? <Truck size={20} /> :
                                                    <FileText size={20} />
                        }
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900">{docName}</h4>
                        <p className="text-xs text-slate-500">
                            {data.status} • {
                                data.status === 'Validated' ? 'Encrypted & Stored' :
                                    data.status === 'Pending Review' ? 'Awaiting Human Review' :
                                        data.status === 'Rejected' ? 'Validation Failed' : 'Action Required'
                            }
                        </p>
                    </div>
                </div>

                {data.status === 'Validated' || data.status === 'Pending Review' ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePreview(docName, data)}
                            className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 font-medium hover:bg-slate-200 flex items-center gap-1"
                        >
                            <Lock size={12} /> {data.status === 'Pending Review' ? 'Review Document' : 'View PDF'}
                        </button>
                        {data.iotaExplorerUrl && data.status === 'Validated' && (
                            <a
                                href={data.iotaExplorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100 font-medium hover:bg-blue-100 flex items-center gap-1"
                            >
                                <ExternalLink size={12} /> IOTA Proof
                            </a>
                        )}
                    </div>
                ) : data.status === 'Rejected' ? (
                    <label className="cursor-pointer px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600">
                        Re-upload
                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(docName, e.target.files[0])} />
                    </label>
                ) : (
                    <label className="cursor-pointer px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800">
                        Upload
                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(docName, e.target.files[0])} />
                    </label>
                )}
            </div>

            {/* Analysis Details (only for validated docs) */}
            {data.analysis && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                    {/* Summary */}
                    {data.analysis.summary && (
                        <p className="text-sm text-slate-600 italic">"{data.analysis.summary}"</p>
                    )}

                    {/* Human Review Reason */}
                    {data.analysis.requiresHumanReview && (
                        <div className="flex flex-col gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <span className="text-lg">🕵️</span>
                                <div>
                                    <p className="text-sm font-semibold text-red-800">Flagged for Human Review</p>
                                    <p className="text-xs text-red-700 mt-1">{data.analysis.reviewReason}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onApprove && onApprove(docName, data)}
                                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-1"
                                >
                                    <CheckCircle size={14} /> Approve & Validate
                                </button>
                                <button
                                    onClick={() => onReject && onReject(docName, data)}
                                    className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors shadow-sm flex items-center gap-1"
                                >
                                    <XCircle size={14} /> Reject
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Route Mismatch Warning */}
                    {data.analysis.routeMismatch && (
                        <div className="flex flex-col gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <span className="text-lg">⚠️</span>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Route Mismatch Detected</p>
                                    <p className="text-xs text-amber-700 mt-1">{data.analysis.routeMismatchWarning}</p>
                                    {data.analysis.extractedDestination && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            Document shows: {data.analysis.extractedOrigin || 'Unknown'} → {data.analysis.extractedDestination}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Self-Correction "Heal" Button */}
                            {data.analysis.alerts?.map((alert: any) =>
                                alert.actions?.map((action: any) => (
                                    <button
                                        key={action.id}
                                        onClick={() => {/* Parent handle logic */ }}
                                        className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-amber-700 transition-all shadow-sm"
                                    >
                                        <ShieldCheck size={14} />
                                        <span>{action.label}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* Security Analysis */}
                    {data.analysis.securityAnalysis && (
                        <div className={`p-3 rounded-lg ${data.analysis.securityAnalysis.isSuspicious ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-sm">
                                    {data.analysis.securityAnalysis.isSuspicious ? '⚠️ Tampering Detected' : '🛡️ AI Forensics & Tampering Analysis Passed'}
                                </span>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${data.analysis.securityAnalysis.tamperScore <= 10 ? 'bg-green-200 text-green-800' :
                                    data.analysis.securityAnalysis.tamperScore <= 40 ? 'bg-yellow-200 text-yellow-800' :
                                        'bg-red-200 text-red-800'
                                    }`}>
                                    Tamper Score: {data.analysis.securityAnalysis.tamperScore}/100
                                </span>
                            </div>
                            <p className="text-xs text-slate-600">{data.analysis.securityAnalysis.suspicionReason}</p>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs">
                                {data.analysis.securityAnalysis.fontConsistency !== undefined && (
                                    <span className={data.analysis.securityAnalysis.fontConsistency ? 'text-green-600' : 'text-red-600'}>
                                        {data.analysis.securityAnalysis.fontConsistency ? '✓' : '✗'} Fonts
                                    </span>
                                )}
                                {data.analysis.securityAnalysis.signaturePresent !== undefined && (
                                    <span className={data.analysis.securityAnalysis.signaturePresent ? 'text-green-600' : 'text-amber-600'}>
                                        {data.analysis.securityAnalysis.signaturePresent ? '✓' : '○'} Signature
                                    </span>
                                )}
                                {data.analysis.securityAnalysis.aiGenerationDetected !== undefined && (
                                    <span className={!data.analysis.securityAnalysis.aiGenerationDetected ? 'text-green-600' : 'text-red-600'}>
                                        {!data.analysis.securityAnalysis.aiGenerationDetected ? '✓' : '✗'} AI Check
                                    </span>
                                )}
                                {data.analysis.securityAnalysis.handwrittenModifications !== undefined && (
                                    <span className={!data.analysis.securityAnalysis.handwrittenModifications ? 'text-green-600' : 'text-amber-600'}>
                                        {!data.analysis.securityAnalysis.handwrittenModifications ? '✓' : '⚠'} Handwritten
                                    </span>
                                )}
                                {data.analysis.securityAnalysis.crossedOutText && (
                                    <span className="text-red-600">✗ Crossed-out Text</span>
                                )}
                            </div>

                            {/* Handwritten Modification Details */}
                            {data.analysis.securityAnalysis.handwrittenModifications && data.analysis.securityAnalysis.handwrittenDetails && (
                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                                    <p className="font-semibold text-amber-800">✏️ Handwritten Modifications Found:</p>
                                    <p className="text-amber-700 mt-1">{data.analysis.securityAnalysis.handwrittenDetails}</p>
                                    {data.analysis.securityAnalysis.inkConsistency === false && (
                                        <p className="text-red-600 mt-1">⚠️ Inconsistent ink colors detected</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Specialist Group Assessment (Audit Trail) */}
                    {data.analysis.agentAuditTrail && data.analysis.agentAuditTrail.length > 0 && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-indigo-600" />
                                <span className="text-xs font-semibold text-indigo-800">Specialist Group Assessment</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {data.analysis.agentAuditTrail.map((activity: any, idx: number) => (
                                    <div
                                        key={idx}
                                        title={activity.summary}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium border ${activity.status === 'success'
                                                ? 'bg-white border-indigo-200 text-indigo-700'
                                                : 'bg-red-50 border-red-200 text-red-700'
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${activity.status === 'success' ? 'bg-indigo-500' : 'bg-red-500'}`} />
                                        {activity.agentName}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Key Info Row */}
                    <div className="flex flex-wrap gap-3 text-xs">
                        {/* Organic Status */}
                        {data.analysis.organicStatus && data.analysis.organicStatus !== 'N/A' && (
                            <span className={`px-2 py-1 rounded-full font-medium ${data.analysis.organicStatus === 'Certified' ? 'bg-green-100 text-green-700' :
                                data.analysis.organicStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                🌿 {data.analysis.organicStatus}
                            </span>
                        )}

                        {/* Validation Level */}
                        <span className={`px-2 py-1 rounded-full font-medium ${data.analysis.validationLevel === 'GREEN' ? 'bg-emerald-100 text-emerald-700' :
                            data.analysis.validationLevel === 'YELLOW' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            {data.analysis.validationLevel === 'GREEN' ? '✅' : data.analysis.validationLevel === 'YELLOW' ? '⚠️' : '❌'} {data.analysis.validationLevel}
                        </span>

                        {/* Confidence */}
                        {data.analysis.confidenceScore && (
                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                                🎯 {Math.round(data.analysis.confidenceScore * 100)}% confidence
                            </span>
                        )}

                        {/* Document ID */}
                        {data.analysis.documentId && (
                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                                📄 {data.analysis.documentId}
                            </span>
                        )}
                    </div>

                    {/* Products with HS Codes */}
                    {data.analysis.products && data.analysis.products.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-slate-500 mb-2">📦 Products ({data.analysis.products.length})</p>
                            <div className="space-y-1">
                                {data.analysis.products.slice(0, 5).map((product: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-700">{product.name}</span>
                                            {product.isOrganic && <span className="text-green-600 text-[10px]">🌿 Organic</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <span>{product.quantity}</span>
                                            {product.hsCode && <span className="font-mono bg-slate-200 px-1 rounded">HS: {product.hsCode}</span>}
                                        </div>
                                    </div>
                                ))}
                                {data.analysis.products.length > 5 && (
                                    <p className="text-xs text-slate-400">+{data.analysis.products.length - 5} more products</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Document Hash */}
                    {data.documentHash && (
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                            <span>🔒 Hash:</span>
                            {data.iotaExplorerUrl ? (
                                <a
                                    href={data.iotaExplorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate max-w-xs hover:text-blue-500 hover:underline transition-colors flex items-center gap-1"
                                    title="View on IOTA Explorer"
                                >
                                    {data.documentHash}
                                    <ExternalLink size={10} className="inline opacity-50" />
                                </a>
                            ) : (
                                <span className="truncate max-w-xs" title="Not yet anchored to IOTA">{data.documentHash}</span>
                            )}
                        </div>
                    )}

                    {/* Validation Checks */}
                    {data.analysis.validationChecks && data.analysis.validationChecks.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {data.analysis.validationChecks.map((check: any, idx: number) => (
                                <span key={idx} className={`text-xs px-2 py-1 rounded ${check.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {check.passed ? '✓' : '✗'} {check.check}
                                </span>
                            ))}
                        </div>
                    )}


                </div>
            )}
        </div>
    );
};
