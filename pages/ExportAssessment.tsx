import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from '../components/compliance/FileUpload';
import { Loader } from '../components/compliance/Loader';
import { ExtractedData } from '../components/compliance/ExtractedData';
import { Checklist } from '../components/compliance/Checklist';
import { AppState, ChecklistItemStatus, ExtractedPOData, ChecklistItem as ChecklistItemType, DocumentType, ChecklistItemCategory } from '../types';
import { OCRFactory } from '../services/compliance/ocr/OCRFactory';
import { generateDraftDocument, checkForRegulatoryUpdates } from '../services/compliance/geminiService';
import { fileToBase64 } from '../services/utils/fileUtils';
import { RegulatoryAlert } from '../components/compliance/RegulatoryAlert';
import { DraftDocumentModal } from '../components/compliance/DraftDocumentModal';
import { AdditionalRequirementsSelector } from '../components/compliance/AdditionalRequirementsSelector';

const ExportAssessment: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.IDLE);
    const [extractedData, setExtractedData] = useState<ExtractedPOData | null>(null);
    const [checklist, setChecklist] = useState<ChecklistItemType[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
    const [modalContent, setModalContent] = useState<{ title: string; html: string } | null>(null);
    const [regulatoryAlert, setRegulatoryAlert] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileUpload = useCallback(async (file: File) => {
        setAppState(AppState.PROCESSING);
        setError(null);
        setExtractedData(null);
        setChecklist([]);
        setRegulatoryAlert(null);
        setSelectedFile(file);

        try {
            const { base64, mimeType } = await fileToBase64(file);

            // Use Factory to get the active provider (defaults to Gemini with enhanced prompt)
            // Pass empty strings for countries as we now expect AI to detect them
            const result = await OCRFactory.getProvider().analyze(base64, mimeType, {
                fromCountry: "",
                toCountry: ""
            });

            setExtractedData(result.extractedData);

            // Phase 2: Attempt to get deterministic rules from BigQuery Engine
            try {
                // Dynamic import to avoid circular dependencies if any, or just standard import at top
                const { checkComplianceRules } = await import('../services/compliance/complianceService');
                const rules = await checkComplianceRules(result.extractedData);

                if (rules && rules.length > 0) {
                    const realChecklist = rules.map(rule => ({
                        id: crypto.randomUUID(),
                        documentName: rule.required_document,
                        description: rule.description || "Required by trade regulation",
                        issuingAgency: "Regulatory Authority",
                        agencyLink: "N/A",
                        category: ChecklistItemCategory.REGULATORY,
                        status: ChecklistItemStatus.PENDING,
                        isMandatory: true
                    }));
                    setChecklist(realChecklist);
                } else {
                    // Fallback to AI checklist if engine returns empty (or no matching rules yet)
                    setChecklist(result.checklist);
                }
            } catch (engineError) {
                console.warn("Compliance Engine connection failed, using AI fallback:", engineError);
                setChecklist(result.checklist);
            }

            setAppState(AppState.RESULTS);
        } catch (err) {
            console.error('Compliance generation failed:', err);
            setError(`Failed to process the document. Error: ${err instanceof Error ? err.message : String(err)}`);
            setAppState(AppState.ERROR);
        }
    }, []);

    useEffect(() => {
        if (appState === AppState.RESULTS && extractedData) {
            const fetchAlerts = async () => {
                const alert = await checkForRegulatoryUpdates(extractedData.originCountry, extractedData.destinationCountry);
                if (alert) {
                    setRegulatoryAlert(alert);
                }
            };
            // Use a timeout to simulate a non-blocking background check
            const timer = setTimeout(fetchAlerts, 1500);
            return () => clearTimeout(timer);
        }
    }, [appState, extractedData]);

    const handleDataUpdate = (newData: ExtractedPOData) => {
        setExtractedData(newData);
        // TODO: Trigger compliance re-calculation here (Phase 3/Part 6)
    };

    const handleGenerateDocument = async (docType: DocumentType) => {
        if (!extractedData) return;
        setIsGeneratingDoc(true);
        setModalContent({ title: `Generating ${docType}...`, html: '<div class="flex justify-center items-center p-8"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600"></div></div>' });

        try {
            const html = await generateDraftDocument(extractedData, docType);
            setModalContent({ title: docType, html });
        } catch (e) {
            console.error("Failed to generate document", e);
            setModalContent({ title: 'Error', html: '<p class="p-8 text-center text-rose-600">Could not generate the document. The AI model returned an unexpected format. Please try again.</p>' });
        } finally {
            setIsGeneratingDoc(false);
        }
    };

    const handleReset = () => {
        setAppState(AppState.IDLE);
        setExtractedData(null);
        setChecklist([]);
        setError(null);
        setRegulatoryAlert(null);
        setModalContent(null);
        setSelectedFile(null);
    };

    const handleChecklistUpdate = (id: string, status: ChecklistItemStatus) => {
        setChecklist(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    };

    const handleChecklistDelete = (id: string) => {
        setChecklist(prev => prev.filter(item => item.id !== id));
    };

    // Handle manual addition of rules
    const handleAddRule = (name: string, category: ChecklistItemCategory) => {
        const newItem: ChecklistItemType = {
            id: crypto.randomUUID(),
            documentName: name,
            description: "Manually added by user requirement.",
            issuingAgency: "User Selected",
            agencyLink: "N/A",
            category: category,
            status: ChecklistItemStatus.PENDING,
            isMandatory: false
        };
        setChecklist(prev => [...prev, newItem]);
    };

    // Demo Data for Verification


    const isProcessing = appState === AppState.PROCESSING;
    const hasKey = !!(import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY);

    return (
        <div className="bg-fuchsia-50/30 min-h-full p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-8">
                {appState !== AppState.IDLE && (
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Export Compliance Assessment</h1>
                        <p className="text-slate-500 mt-2">Upload commercial documents to auto-detect requirements, origin, and destination.</p>
                    </div>
                )}

                {appState === AppState.IDLE && (
                    <div className="space-y-4">
                        <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
                    </div>
                )}

                {isProcessing && (
                    <Loader message="Analyzing document and generating compliance checklist..." />
                )}

                {appState === AppState.ERROR && (
                    <div className="text-center p-10 bg-white rounded-3xl shadow-xl shadow-rose-100/50 border border-rose-100">
                        <div className="inline-flex items-center justify-center p-4 bg-rose-50 rounded-full mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">Analysis Failed</h2>
                        <p className="text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">{error}</p>
                        <button
                            onClick={handleReset}
                            className="bg-fuchsia-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-fuchsia-200 hover:bg-fuchsia-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {appState === AppState.RESULTS && extractedData && (
                    <div className="space-y-8 animate-fade-in-up">
                        {regulatoryAlert && (
                            <RegulatoryAlert
                                message={regulatoryAlert}
                                onDismiss={() => setRegulatoryAlert(null)}
                            />
                        )}
                        <ExtractedData
                            data={extractedData}
                            file={selectedFile}
                            onReset={handleReset}
                            onUpdate={handleDataUpdate}
                            onGenerateDocument={handleGenerateDocument}
                            isGeneratingDoc={isGeneratingDoc}
                        />
                        <Checklist
                            items={checklist}
                            onUpdate={handleChecklistUpdate}
                            onDelete={handleChecklistDelete}
                        />
                        <AdditionalRequirementsSelector onAddRule={handleAddRule} />
                    </div>
                )}
            </div>

            <DraftDocumentModal
                content={modalContent}
                onClose={() => setModalContent(null)}
            />
        </div>
    );
};

export default ExportAssessment;
