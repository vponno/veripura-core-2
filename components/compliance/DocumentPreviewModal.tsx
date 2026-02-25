
import React from 'react';
import { Eye, X, FileText, ShieldCheck, Loader2, Sparkles } from 'lucide-react';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    file?: File | null;
    fileUrl?: string | null;
    isLoading?: boolean;
    onConfirm?: () => void;
    confirmText?: string;
    showActions?: boolean;
    status?: string;
    mimeType?: string | null;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
    isOpen,
    onClose,
    title,
    file,
    fileUrl,
    isLoading = false,
    onConfirm,
    confirmText = "Analyze & Upload",
    showActions = true,
    status,
    mimeType
}) => {
    if (!isOpen) return null;

    const displayUrl = file ? URL.createObjectURL(file) : fileUrl;

    // Improved type detection:
    // 1. If we have a File object, use its type
    // 2. If we have an explicit mimeType prop, use it
    // 3. Fallback to extension check or default to application/pdf (safer for documents)
    const fileType = file ? file.type : (mimeType || (fileUrl?.toLowerCase().includes('.pdf') ? 'application/pdf' : 'application/pdf'));

    const fileName = file ? file.name : title;
    const fileSize = file ? (file.size / 1024).toFixed(1) + ' KB' : 'Remote Document';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-lg">
                            <Eye size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Preview: {title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{fileName} • {fileSize}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 p-4 min-h-[400px]">
                    {displayUrl ? (
                        <>
                            {fileType === 'application/pdf' ? (
                                <iframe
                                    src={displayUrl}
                                    className="w-full h-[60vh] rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
                                    title="PDF Preview"
                                />
                            ) : fileType?.startsWith('image/') ? (
                                <img
                                    src={displayUrl}
                                    alt="Document Preview"
                                    className="max-w-full max-h-[60vh] mx-auto rounded-lg shadow-lg"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-[60vh] text-slate-500 dark:text-slate-400">
                                    <div className="text-center">
                                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Preview limited for this secure format</p>
                                        <p className="text-sm text-slate-400 mt-1">{fileType || 'Encrypted'}</p>
                                        <a href={displayUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-fuchsia-600 font-bold hover:underline">Open in Browser</a>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-[60vh] text-slate-500">
                            <div className="text-center">
                                <Loader2 size={48} className="mx-auto mb-4 animate-spin text-fuchsia-500" />
                                <p>Decrypting Secure Document...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-fuchsia-500" />
                        {status === 'Validated' ? 'Blockchain-verified & immutable' : 'VeriPura™ AI is validating integrity'}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                        >
                            {showActions ? 'Cancel' : 'Close'}
                        </button>
                        {showActions && onConfirm && (
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="px-6 py-2 bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 text-white font-bold rounded-lg hover:from-fuchsia-700 hover:to-fuchsia-800 shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all font-bold"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                {confirmText}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
