
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, X, AlertCircle, CheckCircle, ExternalLink, ShieldCheck, Fingerprint } from 'lucide-react';

interface UploadZoneProps {
    onUpload: (file: File) => void;
    isProcessing: boolean;
    acceptedType?: string;
    label?: string;
    buttonText?: string;
    autoSubmit?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, isProcessing, acceptedType, label, buttonText, autoSubmit }) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndHandleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndHandleFile(e.target.files[0]);
        }
    };

    const validateAndHandleFile = (file: File) => {
        setError(null);
        const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
        // also allow images if needed, but for now strict PDF
        const isImage = file.type.startsWith('image/');

        if (!hasPdfExtension && file.type !== 'application/pdf' && !isImage) {
            setError(`Invalid format. Please upload PDF or Image.`);
            return;
        }

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const clearSelection = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setSelectedFile(null);
        setError(null);
        if (inputRef.current) inputRef.current.value = '';
    }

    const handleConfirm = () => {
        if (selectedFile) {
            onUpload(selectedFile);
        }
    }

    // Auto-Submit Effect
    useEffect(() => {
        if (autoSubmit && selectedFile && !error && !isProcessing) {
            handleConfirm();
        }
    }, [selectedFile, autoSubmit, error]);

    return (
        <div className="w-full animate-fadeIn">
            <div className="relative">
                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700">
                        <AlertCircle size={16} className="shrink-0" />
                        <span className="font-medium text-xs">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto hover:bg-rose-100 p-1 rounded-full"><X size={14} /></button>
                    </div>
                )}

                {isProcessing && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center border border-primary/20 shadow-lg min-h-[200px]">
                        <Loader2 size={32} className="animate-spin text-primary mb-2" />
                        <p className="font-bold text-slate-800 text-sm">Verifying...</p>
                    </div>
                )}

                {selectedFile && previewUrl ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-lg flex items-center justify-center shrink-0">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm truncate max-w-[200px]">{selectedFile.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={clearSelection}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className="w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider bg-slate-900 text-white shadow-md hover:bg-black flex items-center justify-center gap-2 transition-all"
                            >
                                <CheckCircle size={14} className="text-primary" />
                                {buttonText || "Verify Document"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        className={`
              relative w-full h-32 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer
              ${dragActive
                                ? "border-primary bg-primary/5"
                                : "border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-white"
                            }
            `}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,application/pdf,image/*"
                            onChange={handleChange}
                        />
                        <Upload size={24} className="text-slate-400" />
                        <p className="text-xs text-slate-500 font-medium text-center px-4">
                            {label || "Upload Evidence"}
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};
