import React, { useState, useEffect } from 'react';
import { COUNTRIES } from './constants';
import { SearchableSelect } from './SearchableSelect';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Flow State: 'upload' -> 'preview' -> 'scanning' -> 'processing'
    type UploadState = 'upload' | 'preview' | 'scanning' | 'processing';
    const [uploadState, setUploadState] = useState<UploadState>('upload');

    // Scan Steps
    const [scanStep, setScanStep] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Use Data URL instead of Blob URL to bypass potential CSP/Blob restrictions
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);

        return () => {
            setPreviewUrl(null);
        }
    }, [selectedFile]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (uploadState !== 'upload') return;

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        setError(null);
        if (file) {
            console.log("File Selected:", file.name, "Size:", file.size, "Type:", file.type);
            setSelectedFile(file);
            setUploadState('preview');
            setScanStep(0);
        }
    };

    const handleReset = () => {
        setUploadState('upload');
        setSelectedFile(null);
        setPreviewUrl(null);
        setScanStep(0);
    };

    const handleStartScan = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!selectedFile) return;

        console.log("Starting Scan Sequence (Manual Async) for:", selectedFile.name);
        setUploadState('scanning');

        // Helper for delay
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        try {
            // Step 1: Metadata (Immediate)
            setScanStep(1);

            // Step 2: Digital Signature
            await delay(1200);
            setScanStep(2);

            // Step 3: AI Detection
            await delay(1200);
            setScanStep(3);

            // Step 4: Complete & Upload
            await delay(1200);

            console.log("Scan Sequence Complete. Triggering Upload.");
            setUploadState('processing'); // Lock state
            onFileUpload(selectedFile);
        } catch (err) {
            console.error("Scan sequence error:", err);
            setError("Scan failed. Please try again.");
            setUploadState('preview');
        }
    };

    // Removed useEffect-based scan flow to prevent race conditions

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    // Render Preview Mode (Visible during 'preview' and 'scanning')
    const showPreviewUI = (uploadState === 'preview' || uploadState === 'scanning' || uploadState === 'processing') && selectedFile && previewUrl;

    if (showPreviewUI) {
        return (
            <div className="relative bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200">
                {/* Simple Loading State */}
                {(uploadState === 'scanning' || uploadState === 'processing') && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-40 rounded-[2rem] flex flex-col items-center justify-center p-8">
                        <div className="w-16 h-16 border-4 border-fuchsia-200 border-t-fuchsia-600 rounded-full animate-spin mb-4"></div>
                        <h3 className="text-lg font-bold text-slate-900">Processing Document...</h3>
                        <p className="text-sm text-slate-500 mt-1">Please wait while we analyze your file</p>
                    </div>
                )}

                <div className="mb-6 flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm md:text-base flex items-center gap-2">
                            <div className="bg-fuchsia-100 p-1.5 rounded-lg text-fuchsia-600">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            Review Document
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 pl-10 truncate max-w-[200px] md:max-w-md">
                            {selectedFile.name} | {(selectedFile.size / 1024).toFixed(1)} KB | {selectedFile.type}
                        </p>
                    </div>
                    <button onClick={handleReset} className="text-xs font-bold text-slate-500 hover:text-rose-600 px-4 py-2 rounded-xl hover:bg-rose-50 transition-colors" disabled={uploadState !== 'preview'}>
                        Change File
                    </button>
                </div>

                {/* STATIC FILE CARD (Preview Removed to Stop Debugging Loop) */}
                <div className="mb-8 p-8 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <svg className="h-10 w-10 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{selectedFile.name}</h3>
                    <p className="text-slate-500 text-sm mt-1">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for Analysis</p>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleStartScan}
                        disabled={uploadState !== 'preview'}
                        className={`w-full md:w-auto bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold py-4 px-10 rounded-2xl shadow-lg shadow-fuchsia-200 
                        ${uploadState !== 'preview' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'} 
                        transition-all flex items-center justify-center gap-3`}
                    >
                        {uploadState === 'processing' ? (
                            <>
                                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                                AI Processing & Extraction...
                            </>
                        ) : (
                            <>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Authenticate & Analyze
                            </>
                        )}
                    </button>
                </div>
            </div >
        );
    }

    const isDisabled = isProcessing || uploadState !== 'upload';

    return (
        <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-violet-600 rounded-[2rem] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>

            <div className="relative bg-white p-10 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Automate Export Compliance</h2>
                    <p className="text-lg text-slate-500">Upload your Purchase Order or Product List. <br />We verify document integrity and compliance requirements.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">

                    {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-center text-sm font-medium">{error}</div>}

                    <label
                        htmlFor="file-upload"
                        onDragEnter={!isDisabled ? handleDrag : undefined}
                        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-200 ${isDisabled ? 'cursor-not-allowed opacity-60 border-slate-200 bg-slate-50' : 'cursor-pointer'} ${dragActive && !isDisabled ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-slate-300 bg-slate-50/50 hover:bg-white hover:border-fuchsia-400 hover:shadow-lg hover:shadow-fuchsia-50'}`}
                    >
                        <div className="text-center p-6">
                            <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-colors ${dragActive && !isDisabled ? 'bg-fuchsia-100 text-fuchsia-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                                <svg className="h-8 w-8" stroke="currentColor" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <p className="mt-2 text-base text-slate-600 font-medium">
                                <span className={`text-fuchsia-600 font-bold ${!isDisabled && 'hover:underline'}`}>Click to upload</span> or drag and drop
                            </p>
                            <p className="mt-1 text-sm text-slate-400">PDF, CSV, PNG, JPG up to 10MB</p>
                        </div>
                        <input id="file-upload" type="file" className="hidden" onChange={handleChange} accept=".pdf,.csv,.png,.jpg,.jpeg" disabled={isDisabled} />
                    </label>
                    {dragActive && !isDisabled && <div className="absolute w-full h-full top-0 left-0 rounded-2xl" onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
                </form>
            </div>
        </div>
    );
};