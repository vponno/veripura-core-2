import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { iotaService } from '../services/iotaService';
import { ComplianceDocument, ChecklistItem, ChecklistItemCategory, ChecklistItemStatus, Consignment } from '../types';
import { UploadZone } from '../components/UploadZone';
import { COUNTRIES } from '../constants';
import { validationService } from '../services/validationService';
import { consignmentService } from '../services/consignmentService';
import { EncryptionService } from '../services/encryptionService';
import { complianceService } from '../services/complianceService';
import { ExtractedData } from '../components/compliance/ExtractedData';
import { FileUpload } from '../components/compliance/FileUpload';
import { RoadmapCard } from '../components/compliance/RoadmapCard';
import { ConsignmentChat } from '../components/compliance/ConsignmentChat';
import { GuardianRequirementChat } from '../components/compliance/GuardianRequirementChat';
import { CargoAttributesSelector } from '../components/compliance/CargoAttributesSelector';
import { agentService } from '../services/agentService';
import { poService } from '../services/poService';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
    Package, Truck, Info, ArrowRight, Loader2, FileCheck, MapPin,
    Users, Upload, Sparkles, ShieldCheck, ShieldAlert, CheckCircle,
    XCircle, ExternalLink, Box, FileText, Lock, X, Eye, PlusCircle, Bot, Circle, Check,
    Brain, FilePlus, Link
} from 'lucide-react';
import { RouteChangeConfirmation } from '../components/compliance/RouteChangeConfirmation';
import { ComplianceDashboard } from '../components/compliance/ComplianceDashboard';
import { UnifiedDocumentList } from '../components/compliance/UnifiedDocumentList';
import { DocumentPreviewModal } from '../components/compliance/DocumentPreviewModal';
import { SubAgentNotifier } from '../components/compliance/SubAgentNotifier';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface UploadProgressStep {
    id: string;
    label: string;
    status: 'pending' | 'in_progress' | 'completed' | 'error';
    message?: string;
    icon?: string;
}


const RegisterConsignment: React.FC = () => {
    const { currentUser, refreshBalance } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const location = useLocation(); // Used to check query params

    // Progress tracking for PO upload
    // Progress steps for initial PO upload (full flow)
    const initialProgressSteps: UploadProgressStep[] = [
        { id: 'analyze', label: 'AI Document Analysis', status: 'pending', icon: 'Brain' },
        { id: 'create', label: 'Creating Consignment', status: 'pending', icon: 'FilePlus' },
        { id: 'encrypt', label: 'Encrypting & Uploading', status: 'pending', icon: 'Lock' },
        { id: 'anchor', label: 'Blockchain Anchoring', status: 'pending', icon: 'Link' },
        { id: 'guardian', label: 'Guardian Agent Assessment', status: 'pending', icon: 'Shield' },
        { id: 'finalize', label: 'Finalizing', status: 'pending', icon: 'CheckCircle' }
    ];

    // Progress steps for subsequent document uploads
    const subsequentProgressSteps: UploadProgressStep[] = [
        { id: 'analyze', label: 'AI Document Analysis', status: 'pending', icon: 'Brain' },
        { id: 'create', label: 'Encrypting & Preparing Storage', status: 'pending', icon: 'Lock' },
        { id: 'assess', label: 'Guardian Specialist Assessment', status: 'pending', icon: 'ShieldCheck' },
        { id: 'complete', label: 'Complete', status: 'pending', icon: 'CheckCircle' }
    ];

    const [uploadProgress, setUploadProgress] = useState<UploadProgressStep[]>(initialProgressSteps);

    // Scan results for displaying detailed information after upload
    const [scanResults, setScanResults] = useState<{
        documentHash?: string;
        iotaTxHash?: string;
        iotaExplorerUrl?: string;
        flagged?: boolean;
        agentResult?: any;
        updates?: any;
    } | null>(null);

    // Sub-agent notifications
    const [subAgentNotifications, setSubAgentNotifications] = useState<Array<{
        id: string;
        agentName: string;
        status: 'running' | 'completed' | 'failed';
        message: string;
        documentsFound?: number;
        timestamp: number;
    }>>([]);



    const [exportFrom, setExportFrom] = useState('');
    const [importTo, setImportTo] = useState('');
    const [manualRequirements, setManualRequirements] = useState<string[]>([]);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: () => { }
    });
    const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    // Oracle Workflow State
    const [isChatOpen, setIsChatOpen] = useState(false);

    const [hasAnalyzedPO, setHasAnalyzedPO] = useState(false);
    const [oracleAnalysis, setOracleAnalysis] = useState<any>(null);

    // Attribute Options
    const ATTRIBUTE_OPTIONS = [
        'Frozen', 'Fresh/Chilled', 'Dried', 'Roasted',
        'Organic', 'Fairtrade', 'Halal', 'Kosher',
        'Wild Caught', 'Aquaculture', 'Ready-to-Eat'
    ];

    // Helper: Update specific product in the analysis list
    // Helper: Toggle attribute for specific product
    const toggleProductAttribute = (index: number, attr: string) => {
        if (!consignment) return;
        const newProducts = [...(consignment.products || [{ name: consignment.product || '', attributes: [] }])];
        if (!newProducts[index]) newProducts[index] = { name: '', attributes: [] };

        const currentAttrs = newProducts[index].attributes || [];
        const newAttrs = currentAttrs.includes(attr)
            ? currentAttrs.filter((a: string) => a !== attr)
            : [...currentAttrs, attr];

        newProducts[index] = { ...newProducts[index], attributes: newAttrs };

        // Update Local & Persist
        handleFieldChange('products', newProducts);
        // We auto-save attributes immediately for better UX
        consignmentService.updateConsignment(consignment.id, { products: newProducts });
    };

    // Fuzzy Matcher
    const findBestCountryMatch = (input: string): string => {
        if (!input) return "";
        const normalizedInput = input.toLowerCase().trim();
        const direct = COUNTRIES.find(c => c.toLowerCase() === normalizedInput);
        if (direct) return direct;
        const aliases: Record<string, string> = {
            "usa": "United States", "us": "United States", "uk": "United Kingdom",
            "viet nam": "Vietnam", "prc": "China", "cn": "China", "ch": "Switzerland"
        };
        if (aliases[normalizedInput]) return aliases[normalizedInput];
        const substring = COUNTRIES.find(c => normalizedInput.includes(c.toLowerCase()) || c.toLowerCase().includes(normalizedInput));
        return substring || "";
    };

    // Progress helper
    const updateProgress = (stepId: string, status: UploadProgressStep['status'], message?: string) => {
        setUploadProgress(prev => prev.map(step =>
            step.id === stepId ? { ...step, status, message: message || step.message } : step
        ));
    };

    const resetProgress = (useInitialSteps: boolean = true) => {
        const steps = useInitialSteps ? initialProgressSteps : subsequentProgressSteps;
        setUploadProgress(steps);
    };

    const getProgressIcon = (status: UploadProgressStep['status'], iconName?: string) => {
        const iconClass = "w-5 h-5";
        switch (status) {
            case 'completed': return <CheckCircle className={`${iconClass} text-emerald-500`} />;
            case 'in_progress': return <Loader2 className={`${iconClass} text-blue-500 animate-spin`} />;
            case 'error': return <XCircle className={`${iconClass} text-red-500`} />;
            default: return <Circle className={`${iconClass} text-gray-300`} />;
        }
    };

    const getStepIcon = (iconName?: string) => {
        switch (iconName) {
            case 'Brain': return <Brain className="w-5 h-5" />;
            case 'FilePlus': return <FilePlus className="w-5 h-5" />;
            case 'Lock': return <Lock className="w-5 h-5" />;
            case 'Link': return <Link className="w-5 h-5" />;
            case 'Shield': return <ShieldCheck className="w-5 h-5" />;
            case 'ShieldCheck': return <ShieldCheck className="w-5 h-5" />;
            case 'CheckCircle': return <CheckCircle className="w-5 h-5" />;
            default: return <Circle className="w-5 h-5" />;
        }
    };

    const [consignment, setConsignment] = useState<any>(null);

    // Load Consignment from URL ID if present
    React.useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const consignmentId = searchParams.get('id');

        if (consignmentId) {
            setLoading(true);

            // Initial fetch to populate UI immediately
            consignmentService.getConsignment(consignmentId)
                .then(data => {
                    if (data) {
                        setConsignment(data);
                        setExportFrom(data.exportFrom);
                        setImportTo(data.importTo);
                        if ((data as any).analysis) setOracleAnalysis((data as any).analysis);
                        else if ((data as any).products) setOracleAnalysis({ products: (data as any).products });
                    }
                })
                .catch(err => console.error("Initial load failed", err))
                .finally(() => setLoading(false));

            // Real-time subscription
            const unsubscribe = consignmentService.subscribeToConsignment(consignmentId, (data) => {
                console.log("[RegisterConsignment] Real-time Update received");
                setConsignment(data);
                // Sync local uncontrolled states ONLY if they haven't been edited locally (optional optimization)
                // For now, we sync them to ensure consistency
                setExportFrom(data.exportFrom);
                setImportTo(data.importTo);
            });

            return () => unsubscribe();
        }
    }, [location.search]);

    // Preview Modal State
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
    const [pendingDocType, setPendingDocType] = useState<string | null>(null);

    // Route Confirmation State
    const [isRouteConfirmOpen, setIsRouteConfirmOpen] = useState(false);
    const [pendingRoute, setPendingRoute] = useState<{ origin: string, destination: string } | null>(null);

    const initiateRouteUpdate = (newOrigin: string, newDest: string) => {
        if (!consignment) return;
        // Don't trigger if no change
        if (newOrigin === consignment.exportFrom && newDest === consignment.importTo) return;

        setPendingRoute({ origin: newOrigin, destination: newDest });
        setIsRouteConfirmOpen(true);
    };

    const confirmRouteUpdate = async () => {
        if (pendingRoute) {
            await handleRouteChange(pendingRoute.origin, pendingRoute.destination);
            setIsRouteConfirmOpen(false);
            setPendingRoute(null);
        }
    };

    const cancelRouteUpdate = () => {
        // Revert UI to saved state
        if (consignment) {
            setExportFrom(consignment.exportFrom);
            setImportTo(consignment.importTo);
        }
        setIsRouteConfirmOpen(false);
        setPendingRoute(null);
    };

    const handleCreateConsignment = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const newConsignment = await consignmentService.createConsignment(currentUser.uid, { exportFrom, importTo });
            setConsignment(newConsignment);
            // Update URL so reload doesn't lose context (optional but good UX)
            navigate(`?id=${newConsignment.id}`, { replace: true });
        } catch (e) {
            console.error(e);
            setConfirmModal({
                isOpen: true,
                title: 'Operation Failed',
                message: 'Failed to start consignment registration. Please try again.',
                variant: 'danger',
                onConfirm: closeConfirm
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper: Remove undefined values from objects for Firestore compatibility
    const removeUndefined = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => removeUndefined(item));

        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                cleaned[key] = removeUndefined(value);
            }
        }
        return cleaned;
    };

    // Handlers for Document Approval/Rejection
    const handleApprove = async (docName: string, docData: any) => {
        if (!consignment) return;

        console.log('🔍 handleApprove called:', docName, 'docData keys:', Object.keys(docData || {}));

        // Defensive check: Firestore updates fail if any field is undefined.
        const safeDocData = removeUndefined({
            ...docData,
            category: docData.category || 'Commercial',
            issuingAgency: docData.issuingAgency || 'Regulatory Authority',
            required: !!docData.required,
            isMandatory: !!docData.isMandatory,
            status: 'Validated',
            analysis: { ...docData.analysis, requiresHumanReview: false }
        });

        console.log('🔍 handleApprove safeDocData keys:', Object.keys(safeDocData || {}));

        // ATOMIC UPDATE: Only update this specific roadmap item
        await consignmentService.updateRoadmapItem(consignment.id, docName, safeDocData);

        // Local update for immediate feedback
        const updatedRoadmap = { ...consignment.roadmap, [docName]: safeDocData };
        setConsignment({ ...consignment, roadmap: updatedRoadmap });
    };

    const handleReject = async (docName: string, docData: any) => {
        if (!consignment) return;

        console.log('🔍 handleReject called:', docName);

        const safeDocData = removeUndefined({
            ...docData,
            category: docData.category || 'Commercial',
            issuingAgency: docData.issuingAgency || 'Regulatory Authority',
            required: !!docData.required,
            isMandatory: !!docData.isMandatory,
            status: 'Rejected'
        });

        console.log('🔍 handleReject safeDocData keys:', Object.keys(safeDocData || {}));

        // ATOMIC UPDATE: Only update this specific roadmap item
        await consignmentService.updateRoadmapItem(consignment.id, docName, safeDocData);

        // Local update for immediate feedback
        const updatedRoadmap = { ...consignment.roadmap, [docName]: safeDocData };
        setConsignment({ ...consignment, roadmap: updatedRoadmap });
    };

    const handleFieldChange = async (field: string, value: any) => {
        if (!consignment) return;
        const updated = { ...consignment, [field]: value };
        setConsignment(updated);
    };

    const handleFieldBlur = async (field: string, value: any) => {
        if (!consignment) return;
        await consignmentService.updateConsignment(consignment.id, { [field]: value });
    }

    const handleHSLookup = async () => {
        if (!consignment || !consignment.product) return;
        setLoading(true);
        try {
            const result = await complianceService.getHSCode(consignment.product);
            if (result && result.code) {
                const updated = { ...consignment, hsCode: result.code };
                setConsignment(updated);
                await consignmentService.updateConsignment(consignment.id, { hsCode: result.code });
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    // Step 1: Show preview when file is selected
    const handleFileSelect = (docType: string, file: File) => {
        setPendingDocType(docType);
        setPreviewFile(file);
        // Create preview URL for the file
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setPreviewMimeType(file.type);
    };

    // Step 2: Cancel preview
    const handleCancelPreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewFile(null);
        setPreviewUrl(null);
        setPreviewMimeType(null);
        setPendingDocType(null);
    };

    // Step 3: Confirm and process
    const handleConfirmUpload = async () => {
        if (!previewFile || !pendingDocType) return;
        handleCancelPreview(); // Close modal first
        await handleUploadForStep(pendingDocType, previewFile);
    };

    const handleUploadForStep = async (docType: string, file: File) => {
        if (!consignment) return;
        setLoading(true);
        resetProgress(false);
        console.log("Starting atomic upload process for:", docType);

        try {
            // 1. Analyze
            updateProgress('analyze', 'in_progress', 'Analyzing document with AI...');
            console.log("Step 1: AI Analysis...");
            const analysisResult = await validationService.analyzeDocument(file, { exportFrom, importTo });
            updateProgress('analyze', 'completed', 'Document analyzed successfully');
            console.log("Step 1 Complete.");

            // 1b. CHECK: Is this document expected for this consignment?
            const roadmapKeys = Object.keys(consignment.roadmap || {});

            // Normalize document names to handle duplicates and aliases
            const normalizeDocName = (name: string): string => {
                const n = name.toLowerCase().trim();
                // Map aliases to canonical names
                const aliases: Record<string, string[]> = {
                    'bill of lading': ['bill of lading', 'bill of lading _ air waybill', 'bill of lading (or air waybill)', 'b/l', 'bol', 'sea waybill', 'air waybill'],
                    'commercial invoice': ['commercial invoice', 'proforma invoice', 'invoice', 'sales invoice'],
                    'packing list': ['packing list', 'pack list', 'packing slip'],
                    'certificate of origin': ['certificate of origin', 'coo', 'certificate of origin (c.o.o.)'],
                    'health certificate': ['health certificate', 'health certificate _ food safety certificate', 'health certificate (food safety certificate)', 'health certificate (for food products)', 'veterinary certificate'],
                    'phytosanitary certificate': ['phytosanitary certificate', 'phyto certificate', 'plant health certificate'],
                    'organic certificate': ['organic certificate', 'organic certification'],
                };

                for (const [canonical, variants] of Object.entries(aliases)) {
                    if (variants.includes(n) || n.includes(canonical) || canonical.includes(n)) {
                        return canonical;
                    }
                }
                return n;
            };

            const normalizedRoadmapKeys = roadmapKeys.map(k => normalizeDocName(k));
            const detectedDocType = normalizeDocName(analysisResult.documentType || docType);
            const isExpectedDoc = normalizedRoadmapKeys.some(k => k === detectedDocType || detectedDocType.includes(k) || k.includes(detectedDocType));

            if (!isExpectedDoc) {
                console.warn(`[Upload] Document "${analysisResult.documentType}" is NOT in the consignment roadmap. Roadmap keys:`, roadmapKeys);
                updateProgress('analyze', 'error', `Document "${analysisResult.documentType}" is not part of this consignment`);

                // Auto-reject: Document not expected for this consignment
                const rejectData = removeUndefined({
                    status: 'Rejected',
                    category: analysisResult.documentType?.category || 'Unknown',
                    analysis: {
                        ...analysisResult,
                        requiresHumanReview: false,
                        rejectionReason: `Document "${analysisResult.documentType}" is not part of this consignment's compliance roadmap`,
                        validationLevel: 'RED'
                    }
                });
                await consignmentService.updateRoadmapItem(consignment.id, docType, rejectData);

                await agentService.sendMessage(consignment.id,
                    `❌ **Rejected**: The uploaded **${analysisResult.documentType}** does not match any document required for this consignment. Required documents: ${roadmapKeys.join(', ')}`,
                    'alert');

                // Refresh local state
                const updated = await consignmentService.getConsignment(consignment.id);
                if (updated) setConsignment(updated);

                setLoading(false);
                return;
            }

            console.log(`[Upload] Document "${analysisResult.documentType}" is expected for this consignment.`);

            // 2. Encrypt & Prepare Storage (Returns roadmap updates)
            updateProgress('create', 'in_progress', 'Encrypting and preparing storage...');
            console.log("Step 2: Encryption & Preparation...");
            const uploadResult = await consignmentService.uploadDocumentStep(consignment.id, docType, file, analysisResult);
            updateProgress('create', 'completed', 'Storage prepared');

            // Refresh IOTA balance after anchoring
            refreshBalance();

            // 3. Guardian Assessment (Returns roadmap & agentState updates)
            updateProgress('assess', 'in_progress', 'Guardian Specialists performing deep assessment...');
            console.log("Step 3: Guardian Assessment...");
            const assessment = await agentService.assessDocument(consignment.id, docType, analysisResult, {
                ...consignment,
                roadmap: uploadResult.updates.roadmap
            }, file);
            updateProgress('assess', 'completed', 'Specialist assessment complete');
            console.log("Step 3 Complete.");

            // 4. ATOMIC UPDATE: Send specific fields to avoid clobbering
            console.log("Step 4: Atomic Update to Firestore...");
            const updates: any = {};

            // Atomic roadmap update (handles dots in docType)
            if (assessment.updates.roadmap) {
                Object.entries(assessment.updates.roadmap).forEach(([key, value]) => {
                    updates[`roadmap.${key}`] = value;
                });
            }

            // Atomic agent state update
            updates.agentState = {
                ...assessment.updates.agentState,
                unreadCount: (consignment.agentState?.unreadCount || 0) + 1
            };

            await consignmentService.updateConsignment(consignment.id, updates);

            // 5. Send Summary Alert (Separate for simplicity as it has its own persistence)
            const result = assessment.result;
            if (result.alerts.length > 0) {
                const alertContent = `⚠️ **Guardian Assessment**: specialists found discrepancies in the **${docType}**:\n\n${result.alerts.map(a => `- ${a.message}`).join('\n')}`;
                await agentService.sendMessage(consignment.id, alertContent, 'alert');
            } else {
                await agentService.sendMessage(consignment.id, `✅ **Specialist Fleet** has verified the **${docType}**. No major compliance risks detected.`, 'success');
            }

            // 6. Update Local State
            const updated = await consignmentService.getConsignment(consignment.id);
            if (updated) {
                setConsignment(updated);
                // Auto-open chat if there are alerts
                const newMessages = updated.agentState?.messages || [];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.type === 'alert') {
                    setIsChatOpen(true);
                }
            }
            console.log("Step 6 Complete: State Updated.");

        } catch (e: any) {
            console.error("Critical Error during upload:", e);
            const errorMsg = e.message || JSON.stringify(e);
            setStatusMessage(`Error: ${errorMsg}`);
            // Keep loading true for a moment so user sees the error? 
            // Or better: use a separate error state. 
            // For now, let's use ConfirmModal but ensure it's processed after a slight delay to avoid race conditions with modal closing
            setTimeout(() => {
                setConfirmModal({
                    isOpen: true,
                    title: 'Upload Failed',
                    message: `Discovery and upload failed: ${errorMsg}`,
                    variant: 'danger',
                    onConfirm: closeConfirm
                });
            }, 100);
        } finally {
            setLoading(false);
            // setStatusMessage(null); // Don't clear immediately if we want to show it, but loading hides it.
        }
    };


    const handlePreview = async (docType: string, data: any) => {
        // Check what's missing for better error messages
        const missingFields = [];
        if (!data?.fileUrl) missingFields.push("file URL");
        if (!data?.fileIv) missingFields.push("encryption IV");
        if (!consignment?.encryptionKeyJwk) missingFields.push("encryption key");

        if (missingFields.length > 0) {
            setConfirmModal({
                isOpen: true,
                title: 'Decryption Blocked',
                message: `Cannot decrypt: Missing ${missingFields.join(", ")}. The document may still be processing or there was an upload error.`,
                variant: 'warning',
                onConfirm: closeConfirm
            });
            console.error("Preview failed - missing data:", {
                data,
                consignment: { encryptionKeyJwk: !!consignment?.encryptionKeyJwk },
                docType
            });
            return;
        }

        console.log(`[RegisterConsignment] Decrypting ${docType} for in-app preview. IV: ${data.fileIv}`);
        setPendingDocType(docType);
        setLoading(true);

        try {
            // 1. Fetch Encrypted Blob
            const response = await fetch(data.fileUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
            }
            const encryptedBlob = await response.blob();

            // 2. Import Key
            const key = await EncryptionService.importKey(consignment.encryptionKeyJwk);

            // 3. Decrypt
            const iv = EncryptionService.stringToIv(data.fileIv);
            const decryptedBlob = await EncryptionService.decryptFile(encryptedBlob, key, iv, data.fileType);

            // 4. Create URL & Show Modal
            const url = URL.createObjectURL(decryptedBlob);
            setPreviewUrl(url);
            setPreviewMimeType(data.fileType || decryptedBlob.type);
            // We set previewFile to null to signal this is a VIEW of an existing doc, not a new UPLOAD
            setPreviewFile(null);
        } catch (e) {
            console.error("Decryption failed:", e);
            setConfirmModal({
                isOpen: true,
                title: 'Preview Failed',
                message: `Failed to decrypt document: ${e instanceof Error ? e.message : "Unknown error"}. Please try refreshing the page.`,
                variant: 'danger',
                onConfirm: closeConfirm
            });
        } finally {
            setLoading(false);
        }
    };

    // --- Refactored: Reusable Compliance Logic ---
    const refreshComplianceRoadmap = async (origin: string, dest: string, product: string, hsCode: string, existingReqs: string[]) => {
        // 1. Get AI Requirements
        console.log(`Refreshing roadmap for ${origin} -> ${dest} (${product}, HS: ${hsCode})`);
        const aiDocs = await complianceService.getRequiredDocuments(product, origin, dest, hsCode);

        // 2. Build Roadmap Object - MERGING with existing data if available
        const currentRoadmap = consignment?.roadmap || {};
        const dynamicRoadmap: any = { ...currentRoadmap };

        // Sanitize AND normalize document names to prevent duplicates
        // Keys cannot contain: ~ * / [ ] \ and cannot start with .
        const normalizeDocName = (name: string): string => {
            let n = String(name)
                .replace(/^[.]+/, '') // Remove leading dots
                .replace(/[~*\/\[\\\]]/g, '_') // Replace invalid chars with underscore
                .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parenthetical suffixes like "(Switzerland)"
                .replace(/[-/&]/g, ' ') // Replace common separators with space
                .replace(/_+/g, ' ') // Replace underscores with spaces
                .replace(/\s+/g, ' ') // Collapse multiple spaces to single
                .trim()
                .toLowerCase();

            // Normalize common aliases to canonical names
            const aliases: Record<string, string[]> = {
                'bill of lading': ['bill of lading', 'bill of lading air waybill', 'bill of lading (or air waybill)', 'b/l', 'bol', 'sea waybill', 'air waybill'],
                'commercial invoice': ['commercial invoice', 'proforma invoice', 'invoice', 'sales invoice', 'sales contract'],
                'packing list': ['packing list', 'pack list', 'packing slip'],
                'certificate of origin': ['certificate of origin', 'coo', 'certificate of origin (c.o.o.)'],
                'health certificate': ['health certificate', 'health certificate food safety certificate', 'health certificate (food safety certificate)', 'health certificate (for food products)', 'veterinary certificate'],
                'phytosanitary certificate': ['phytosanitary certificate', 'phyto certificate', 'plant health certificate'],
                'organic certificate': ['organic certificate', 'organic certification'],
                'import permit': ['import permit', 'import license', 'import permit (switzerland)', 'import license permit (switzerland)'],
                'customs declaration': ['customs declaration', 'customs import declaration', 'customs import declaration (switzerland)'],
            };

            for (const [canonical, variants] of Object.entries(aliases)) {
                // Normalize variants the same way before comparing
                const normalizedVariants = variants.map(v => v.replace(/[-/&]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase());
                if (normalizedVariants.includes(n) || n.includes(canonical) || canonical.includes(n)) {
                    return canonical;
                }
            }
            return n;
        };

        aiDocs.forEach(d => {
            const normalizedName = normalizeDocName(d.name);

            // Check if this normalized name already exists (case-insensitive)
            const existingKey = Object.keys(dynamicRoadmap).find(k => normalizeDocName(k) === normalizedName);

            if (existingKey) {
                // Preserve existing upload data, just update meta if needed
                dynamicRoadmap[existingKey] = {
                    ...dynamicRoadmap[existingKey],
                    description: d.description || dynamicRoadmap[existingKey].description,
                    category: d.category || dynamicRoadmap[existingKey].category,
                    issuingAgency: d.issuingAgency || dynamicRoadmap[existingKey].issuingAgency || 'Regulatory Authority',
                    required: d.isMandatory !== false
                };
            } else {
                // New requirement - use sanitized name but prefer normalized for consistency
                const safeName = String(d.name)
                    .replace(/^[.]+/, '')
                    .replace(/[~*\/\[\\\]]/g, '_')
                    .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parenthetical
                    .trim();

                dynamicRoadmap[safeName] = {
                    required: d.isMandatory !== false,
                    status: 'Pending',
                    description: d.description,
                    category: d.category,
                    issuingAgency: d.issuingAgency || 'Regulatory Authority'
                };
            }
        });

        // 3. Merge Manual Requirements
        existingReqs.forEach(req => {
            const normalizedReq = normalizeDocName(req);
            const existingKey = Object.keys(dynamicRoadmap).find(k => normalizeDocName(k) === normalizedReq);

            if (!existingKey) {
                const responsibleAgent = complianceService.getResponsibleAgent(req, 'Custom');
                const safeReq = String(req)
                    .replace(/^[.]+/, '')
                    .replace(/[~*\/\[\\\]]/g, '_')
                    .replace(/\s*\([^)]*\)\s*/g, ' ')
                    .trim();
                dynamicRoadmap[safeReq] = {
                    required: true,
                    status: 'Pending',
                    description: 'Manually added requirement via Dashboard.',
                    category: 'Custom',
                    generatedBy: 'User',
                    issuingAgency: responsibleAgent
                };
            }
        });

        return dynamicRoadmap;
    };

    const handleRouteChange = async (newOrigin: string, newDest: string) => {
        if (!consignment) return;
        if (newOrigin === exportFrom && newDest === importTo) return; // No change

        setExportFrom(newOrigin);
        setImportTo(newDest);
        setLoading(true);
        setStatusMessage("Route changed. Re-calculating Compliance Roadmap...");

        try {
            const product = consignment.product || 'General';
            const hsCode = consignment.hsCode || '';
            const newRoadmap = await refreshComplianceRoadmap(newOrigin, newDest, product, hsCode, manualRequirements);

            // ATOMIC UPDATE: Send individual fields to avoid clobbering other roadmap items
            const updates: any = {
                exportFrom: newOrigin,
                importTo: newDest
            };

            // Convert new roadmap to atomic field updates (dot notation)
            Object.entries(newRoadmap).forEach(([key, value]) => {
                updates[`roadmap.${key}`] = value;
            });

            await consignmentService.updateConsignment(consignment.id, updates);
        } catch (e) {
            console.error("Failed to update route/roadmap:", e);
            setConfirmModal({
                isOpen: true,
                title: 'Roadmap Error',
                message: "Failed to refresh compliance requirements for the selected route.",
                variant: 'danger',
                onConfirm: closeConfirm
            });
        } finally {
            setLoading(false);
            setStatusMessage(null);
        }
    };

    const handleHSCodeChange = async (newCode: string) => {
        if (!consignment) return;
        const currentCode = consignment.hsCode;
        if (newCode === currentCode) return;

        // Update local state immediately
        await handleFieldBlur('hsCode', newCode);

        setLoading(true);
        setStatusMessage("HS Code changed. Re-calculating Compliance Roadmap...");

        try {
            const product = consignment.product || 'General';
            // Use current export/import as truth
            const newRoadmap = await refreshComplianceRoadmap(exportFrom, importTo, product, newCode, manualRequirements);

            const updates: any = { hsCode: newCode };

            // Convert to atomic field updates
            Object.entries(newRoadmap).forEach(([key, value]) => {
                updates[`roadmap.${key}`] = value;
            });

            await consignmentService.updateConsignment(consignment.id, updates);

        } catch (e) {
            console.error("Failed to update HS Code/roadmap:", e);
            setConfirmModal({
                isOpen: true,
                title: 'HS Code Error',
                message: "Failed to refresh compliance requirements based on the new HS Code.",
                variant: 'danger',
                onConfirm: closeConfirm
            });
        } finally {
            setLoading(false);
            setStatusMessage(null);
        }
    };

    // --- NEW: Rapid Scan (One-Step Flow) with Progress Tracking ---
    const handleRapidScan = async (file: File) => {
        if (!currentUser) {
            setConfirmModal({
                isOpen: true,
                title: 'Sign In Required',
                message: 'Please sign in to access the VeriPura Rapid Scan and Register Consignments.',
                variant: 'info',
                onConfirm: () => navigate('/login')
            });
            return;
        }

        setLoading(true);
        resetProgress();

        try {
            // Step 1: AI Document Analysis
            updateProgress('analyze', 'in_progress', 'Analyzing document with AI...');
            console.log("Rapid Scan Step 1: AI Document Analysis...");
            const analysis = await validationService.extractTradeDna(file);
            analysis.extractedOrigin = analysis.originCountry;
            analysis.extractedDestination = analysis.destinationCountry;
            setOracleAnalysis(analysis);
            setHasAnalyzedPO(true);
            updateProgress('analyze', 'completed', 'Document analyzed successfully');
            setStatusMessage("✅ Document analyzed. Extracting trade data...");

            // Step 2: Derive Data
            let origin = analysis.originCountry || exportFrom;
            let dest = analysis.destinationCountry || importTo;

            const matchedOrigin = findBestCountryMatch(origin);
            if (matchedOrigin) origin = matchedOrigin;
            const matchedDest = findBestCountryMatch(dest);
            if (matchedDest) dest = matchedDest;

            setExportFrom(origin);
            setImportTo(dest);

            // Step 3: Dynamic Compliance
            updateProgress('create', 'in_progress', 'Generating compliance roadmap...');
            const detectedProduct = analysis.products?.[0]?.name || 'General';
            const detectedHS = analysis.products?.[0]?.hsCode || '';
            const dynamicRoadmap = await refreshComplianceRoadmap(origin, dest, detectedProduct, detectedHS, manualRequirements);

            // Step 4: Create Consignment
            console.log("Rapid Scan Step 4: Creating consignment...");
            const newConsignment = await consignmentService.createConsignment(currentUser.uid, {
                exportFrom: origin,
                importTo: dest,
                sellerName: analysis.sellerName,
                buyerName: analysis.buyerName,
                additionalRequirements: manualRequirements,
                roadmap: dynamicRoadmap,
                products: analysis.products?.map((p: any) => ({
                    name: p.name,
                    hsCode: p.hsCode,
                    attributes: p.attributes,
                    quantity: p.quantity,
                    packaging: p.packaging,
                    volume: p.volume,
                    weight: p.grossWeight
                }))
            });
            updateProgress('create', 'completed', 'Consignment created');
            setStatusMessage("✅ Consignment created. Encrypting document...");

            // Step 5: Upload with poService (Encryption + IOTA + Guardian Agent)
            updateProgress('encrypt', 'in_progress', 'Encrypting document...');
            updateProgress('anchor', 'in_progress', 'Waiting for blockchain...');
            updateProgress('guardian', 'in_progress', 'Initializing Guardian Agent...');

            console.log("Rapid Scan Step 5: PO Service Upload with Orchestrator...");

            const poResult = await poService.uploadPurchaseOrder({
                consignmentId: newConsignment.id,
                file,
                analysisResult: analysis
            });

            // Store scan results for display
            setScanResults({
                documentHash: poResult.documentHash,
                iotaTxHash: poResult.iotaTxHash,
                iotaExplorerUrl: poResult.iotaExplorerUrl,
                flagged: poResult.flagged,
                agentResult: poResult.agentResult,
                updates: poResult.updates
            });

            updateProgress('encrypt', 'completed', 'Document encrypted & uploaded');
            updateProgress('anchor', poResult.iotaTxHash ? 'completed' : 'pending',
                poResult.iotaTxHash ? 'Anchored to blockchain' : 'Blockchain anchoring skipped');
            updateProgress('guardian', 'completed', 'Guardian assessment complete');

            // Specialist findings are now displayed inline in the compliance roadmap cards
            // so we don't need to show them as separate notification popups

            setStatusMessage("✅ Processing complete! Finalizing...");

            // Step 6: Get final state and send alerts
            updateProgress('finalize', 'in_progress', 'Finalizing...');

            const activeConsignment = await consignmentService.getConsignment(newConsignment.id);

            // Send appropriate message based on alerts
            if (poResult.flagged || (poResult.agentResult?.alerts?.length > 0)) {
                const alertContent = `⚠️ **Guardian Assessment**: specialists found issues in the **Purchase Order**:\n\n${poResult.agentResult.alerts.map((a: any) => `- ${a.message}`).join('\n')}`;
                await agentService.sendMessage(newConsignment.id, alertContent, 'alert');
            } else {
                await agentService.sendMessage(newConsignment.id,
                    `✅ **Specialist Fleet** has verified the **Purchase Order**. No major compliance risks detected.`, 'success');
            }

            updateProgress('finalize', 'completed', 'Complete');
            setConsignment(activeConsignment);

            // Delay navigation so user can see detailed results
            // If document is flagged, show longer delay
            const delayMs = (poResult.flagged || poResult.agentResult?.alerts?.length > 0) ? 8000 : 5000;
            console.log(`[RapidScan] Waiting ${delayMs}ms before navigation so user can see results...`);

            await new Promise(resolve => setTimeout(resolve, delayMs));

            // Only navigate if we're still on the same page (user hasn't clicked elsewhere)
            if (window.location.pathname === '/register-consignment' || window.location.pathname === '/') {
                navigate(`?id=${newConsignment.id}`, { replace: true });
            }

        } catch (e) {
            console.error("Rapid Scan Failed:", e);

            // Mark current step as error
            const currentStep = uploadProgress.find(s => s.status === 'in_progress');
            if (currentStep) {
                updateProgress(currentStep.id, 'error', `Error: ${e instanceof Error ? e.message : String(e)}`);
            }

            setConfirmModal({
                isOpen: true,
                title: 'Scan Failed',
                message: `The AI Rapid Scan encountered a critical error: ${e instanceof Error ? e.message : String(e)}`,
                variant: 'danger',
                onConfirm: closeConfirm
            });
        } finally {
            setLoading(false);
            setStatusMessage(null);
        }
    };

    // --- Render Selection View (Rapid Scan) ---
    if (!consignment) {
        return (
            <div className="max-w-5xl mx-auto pb-20 pt-10">
                {!hasAnalyzedPO && (
                    <div className="max-w-4xl mx-auto pt-10">
                        <FileUpload onFileUpload={handleRapidScan} isProcessing={loading} />
                    </div>
                )}

                {loading && hasAnalyzedPO && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                        {/* Progress Tracker */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mb-8 max-w-2xl mx-auto border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                VeriPura AI Processing
                            </h3>

                            <div className="space-y-3">
                                {uploadProgress.map((step, index) => (
                                    <div key={step.id} className={`flex items-center gap-3 p-3 rounded-lg border ${step.status === 'in_progress' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50' :
                                        step.status === 'completed' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' :
                                            step.status === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50' : 'bg-gray-50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700/50'
                                        }`}>
                                        <div className={`p-2 rounded-full ${step.status === 'in_progress' ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200' :
                                            step.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-200' :
                                                step.status === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200' : 'bg-gray-200 text-gray-400 dark:bg-slate-700 dark:text-slate-500'
                                            }`}>
                                            {getStepIcon(step.icon)}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${step.status === 'in_progress' ? 'text-blue-700 dark:text-blue-300' :
                                                step.status === 'completed' ? 'text-emerald-700 dark:text-emerald-300' :
                                                    step.status === 'error' ? 'text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-slate-400'
                                                }`}>
                                                {step.label}
                                            </p>
                                            {step.message && step.status !== 'pending' && (
                                                <p className="text-xs text-gray-600 mt-0.5">{step.message}</p>
                                            )}
                                        </div>
                                        {step.status === 'in_progress' && (
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                        )}
                                        {step.status === 'completed' && (
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {statusMessage && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{statusMessage}</p>
                                </div>
                            )}
                        </div>

                        {/* Detailed Scan Results */}
                        {scanResults && !loading && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mb-8 max-w-2xl mx-auto border border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    Document Processing Complete
                                </h3>

                                {/* Document Info */}
                                <div className="space-y-4 mb-6">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 font-black uppercase tracking-wider">Purchase Order Details</h4>
                                        {oracleAnalysis && (
                                            <div className="space-y-2 text-sm">
                                                {oracleAnalysis.sellerName && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Seller:</span>
                                                        <span className="font-medium text-slate-900">{oracleAnalysis.sellerName}</span>
                                                    </div>
                                                )}
                                                {oracleAnalysis.buyerName && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Buyer:</span>
                                                        <span className="font-medium text-slate-900">{oracleAnalysis.buyerName}</span>
                                                    </div>
                                                )}
                                                {oracleAnalysis.originCountry && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Origin:</span>
                                                        <span className="font-medium text-slate-900">{oracleAnalysis.originCountry}</span>
                                                    </div>
                                                )}
                                                {oracleAnalysis.destinationCountry && (
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Destination:</span>
                                                        <span className="font-medium text-slate-900">{oracleAnalysis.destinationCountry}</span>
                                                    </div>
                                                )}
                                                {oracleAnalysis.products && oracleAnalysis.products[0] && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500 dark:text-slate-400">Product:</span>
                                                            <span className="font-medium text-slate-900 dark:text-white">{oracleAnalysis.products[0].name}</span>
                                                        </div>
                                                        {oracleAnalysis.products[0].hsCode && (
                                                            <div className="flex justify-between">
                                                                <span className="text-slate-500 dark:text-slate-400">HS Code:</span>
                                                                <span className="font-medium text-slate-900 dark:text-white">{oracleAnalysis.products[0].hsCode}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Security & Blockchain */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 font-black uppercase tracking-wider">Security & Verification</h4>
                                        <div className="space-y-2">
                                            {scanResults.documentHash && (
                                                <div className="text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">Document Hash:</span>
                                                    <code className="ml-2 px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded text-xs font-mono break-all text-slate-600 dark:text-slate-300">
                                                        {scanResults.documentHash.substring(0, 20)}...{scanResults.documentHash.substring(scanResults.documentHash.length - 8)}
                                                    </code>
                                                </div>
                                            )}
                                            {scanResults.iotaTxHash && (
                                                <div className="text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400">IOTA Transaction:</span>
                                                    <a
                                                        href={scanResults.iotaExplorerUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-2 text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                                                    >
                                                        View on Explorer
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Guardian Assessment */}
                                    {scanResults.agentResult && (
                                        <div className={`p-4 rounded-lg ${scanResults.flagged ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4" />
                                                Guardian Agent Assessment
                                            </h4>
                                            <p className={`text-sm ${scanResults.flagged ? 'text-amber-800' : 'text-emerald-800'}`}>
                                                {scanResults.flagged
                                                    ? '⚠️ Issues detected - please review the compliance requirements'
                                                    : '✓ No major compliance risks detected'}
                                            </p>
                                            {scanResults.agentResult.alerts && scanResults.agentResult.alerts.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {scanResults.agentResult.alerts.map((alert: any, idx: number) => (
                                                        <p key={idx} className="text-xs text-amber-700">
                                                            • {alert.message}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="text-center">
                                    <Loader2 className="animate-spin mb-2 mx-auto w-6 h-6 text-slate-400" />
                                    <p className="text-sm text-slate-600">Redirecting to consignment...</p>
                                </div>
                            </div>
                        )}

                        {!loading && !scanResults && (
                            <div className="text-center">
                                <Loader2 className="animate-spin mb-4 mx-auto" />
                                <p>{statusMessage || "Finalizing Consignment..."}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }



    // --- Render Roadmap View ---
    const roadmapItems = Object.entries(consignment.roadmap || {});
    const hasItems = roadmapItems.length > 0;

    // Prepare unified document list from roadmap
    const allDocuments = roadmapItems
        .map(([name, data]: [string, any]) => ({
            name,
            status: data.status || 'Pending',
            category: data.category,
            required: data.required || data.isMandatory,
            addedBy: data.addedBy,
            description: data.description,
            agencyLink: data.agencyLink,
            issuingAgency: data.issuingAgency,
            isMandatory: data.isMandatory,
            fileUrl: data.fileUrl,
            fileIv: data.fileIv,
            iotaExplorerUrl: data.iotaExplorerUrl,
            iotaTxHash: data.iotaTxHash,
            iotaTxCost: data.iotaTxCost,
            iotaError: data.iotaError,
            analysis: data.analysis
        }))
        // Sort: Validated first, then Pending, then others (case-insensitive)
        .sort((a, b) => {
            const statusOrder: Record<string, number> = {
                'validated': 0,
                'pending': 1,
                'pending review': 2,
                'rejected': 3
            };
            const orderA = statusOrder[a.status?.toLowerCase() ?? ''] ?? 99;
            const orderB = statusOrder[b.status?.toLowerCase() ?? ''] ?? 99;
            return orderA - orderB;
        });

    // Check if Packing List is uploaded to show/hide Logistics section
    const hasPackingList = Object.entries(consignment.roadmap || {}).some(([name, item]: [string, any]) =>
        name.toLowerCase().includes('packing list') && item.status === 'Validated'
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 text-slate-900 dark:text-white">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Consignment #{consignment.id.slice(0, 6)}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <input
                            type="text"
                            value={exportFrom}
                            onChange={(e) => setExportFrom(e.target.value)}
                            onBlur={(e) => {
                                const val = findBestCountryMatch(e.target.value) || e.target.value;
                                setExportFrom(val);
                                // Check if changed significantly before triggering confirmation
                                if (val !== consignment?.exportFrom) {
                                    initiateRouteUpdate(val, importTo);
                                }
                            }}
                            className="bg-transparent border-b border-slate-300 focus:border-fuchsia-500 outline-none text-slate-600 font-medium w-32 pb-0.5 text-sm transition-colors"
                            placeholder="Origin"
                        />
                        <ArrowRight className="text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            value={importTo}
                            onChange={(e) => setImportTo(e.target.value)}
                            onBlur={(e) => {
                                const val = findBestCountryMatch(e.target.value) || e.target.value;
                                setImportTo(val);
                                // Check if changed significantly before triggering confirmation
                                if (val !== consignment?.importTo) {
                                    initiateRouteUpdate(exportFrom, val);
                                }
                            }}
                            className="bg-transparent border-b border-slate-300 focus:border-fuchsia-500 outline-none text-slate-600 font-medium w-32 pb-0.5 text-sm transition-colors"
                            placeholder="Destination"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${(consignment?.agentState?.unreadCount || 0) > 0
                            ? 'bg-fuchsia-100 text-fuchsia-700 animate-pulse'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        <Bot size={14} /> Agent
                        {(consignment?.agentState?.unreadCount || 0) > 0 && (
                            <span className="ml-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                {consignment.agentState.unreadCount}
                            </span>
                        )}
                    </button>
                    <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold flex items-center gap-1">
                        <ShieldCheck size={14} /> Secure & Encrypted
                    </div>
                </div>
            </div>

            <ErrorBoundary>
                <ConsignmentChat
                    consignmentId={consignment.id}
                    messages={consignment.agentState?.messages || []}
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                />
            </ErrorBoundary>

            <RouteChangeConfirmation
                isOpen={isRouteConfirmOpen}
                onClose={cancelRouteUpdate}
                onConfirm={confirmRouteUpdate}
                oldRoute={{ origin: consignment.exportFrom, destination: consignment.importTo }}
                newRoute={pendingRoute || { origin: '', destination: '' }}
            />

            <ErrorBoundary>
                <GuardianRequirementChat
                    onAddRule={(name, category) => {
                        const newReq: ChecklistItem = {
                            id: name, // Using name as ID for now
                            documentName: name,
                            description: 'Manually added requirement.',
                            category: category,
                            issuingAgency: complianceService.getResponsibleAgentSync(name, category),
                            agencyLink: '',
                            status: ChecklistItemStatus.PENDING,
                            isMandatory: true
                        };
                        const available = consignment?.roadmap || {};
                        const updatedMap = { ...available, [name]: newReq };
                        setConsignment({ ...consignment, roadmap: updatedMap } as Consignment);
                        if (consignment?.id) {
                            consignmentService.updateConsignment(consignment.id, { roadmap: updatedMap });
                        }
                    }}
                    onRemoveRule={(name) => {
                        const available = consignment?.roadmap || {};
                        // Create a copy to avoid direct mutation (though spread does shallow copy)
                        const updatedMap = { ...available };

                        // Simple fuzzy delete if exact match fails
                        if (updatedMap[name]) {
                            delete updatedMap[name];
                        } else {
                            // Try to find by partial match / loose equality if LLM returns different casing
                            const key = Object.keys(updatedMap).find(k => k.toLowerCase() === name.toLowerCase());
                            if (key) delete updatedMap[key];
                        }

                        setConsignment({ ...consignment, roadmap: updatedMap } as Consignment);
                        if (consignment?.id) {
                            consignmentService.updateConsignment(consignment.id, { roadmap: updatedMap });
                        }
                    }}
                />
            </ErrorBoundary>

            {/* Compliance Roadmap (Moved to Top) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Compliance Roadmap</h3>

                {/* Guardian Agent Analysis Dashboard */}
                {(consignment?.agentState?.activityLog?.length > 0 ||
                    Object.values(consignment?.roadmap || {}).some((d: any) => d.addedBy === 'guardian_agent') ||
                    allDocuments.length > 0) && (
                        <div className="mb-8">
                            <ComplianceDashboard
                                activities={consignment?.agentState?.activityLog || []}
                                validationHistory={consignment?.validationHistory}
                                roadmap={consignment?.roadmap || {}}
                                pendingDocs={allDocuments}
                            />
                        </div>
                    )}

                {/* Initial "Seed" Upload if empty */}
                {!hasItems && (
                    <div className="mb-8">
                        <UploadZone onUpload={(f) => handleFileSelect("Purchase Order", f)} isProcessing={loading} />
                        <p className="text-center text-sm text-slate-400 mt-2">Upload your first document (e.g. Purchase Order) to generate the full roadmap.</p>
                    </div>
                )}

                {/* Unified Document List - All Documents in One Place */}
                <ErrorBoundary>
                    <UnifiedDocumentList
                        documents={allDocuments}
                        onUpload={handleFileSelect}
                        onPreview={handlePreview}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                </ErrorBoundary>


            </div>

            {/* Shipment Logistics (Conditionally Rendered) */}
            {(hasPackingList || consignment?.products?.[0]?.packaging || consignment?.products?.[0]?.volume || consignment?.products?.[0]?.weight) && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 opacity-80 hover:opacity-100 transition-opacity animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-700">
                        <Package className="text-slate-500" /> Shipment Logistics
                        <span className="text-xs font-normal bg-slate-200 px-2 py-1 rounded text-slate-500 ml-2">Synced from Packing List</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Packaging */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Packaging</label>
                            <input
                                type="text"
                                value={consignment?.products?.[0]?.packaging || ''}
                                onChange={(e) => {
                                    const newProducts = [...(consignment?.products || [{ name: consignment?.product || '' }])];
                                    newProducts[0] = { ...newProducts[0], packaging: e.target.value };
                                    handleFieldChange('products', newProducts);
                                }}
                                onBlur={() => handleFieldBlur('products', consignment?.products)}
                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                                placeholder="e.g. 200 Cartons"
                            />
                        </div>

                        {/* Volume */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Volume</label>
                            <input
                                type="text"
                                value={consignment?.products?.[0]?.volume || ''}
                                onChange={(e) => {
                                    const newProducts = [...(consignment?.products || [{ name: consignment?.product || '' }])];
                                    newProducts[0] = { ...newProducts[0], volume: e.target.value };
                                    handleFieldChange('products', newProducts);
                                }}
                                onBlur={() => handleFieldBlur('products', consignment?.products)}
                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                                placeholder="e.g. 10 cbm"
                            />
                        </div>
                        {/* Weight */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gross Weight</label>
                            <input
                                type="text"
                                value={consignment?.products?.[0]?.weight || ''}
                                onChange={(e) => {
                                    const newProducts = [...(consignment?.products || [{ name: consignment?.product || '' }])];
                                    newProducts[0] = { ...newProducts[0], weight: e.target.value };
                                    handleFieldChange('products', newProducts);
                                }}
                                onBlur={() => handleFieldBlur('products', consignment?.products)}
                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500 outline-none"
                                placeholder="e.g. 5200 kg"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Route Mismatch Correction Modal */}
            {
                consignment?.roadmap && Object.values(consignment.roadmap).some((item: any) => item.analysis?.routeMismatch && item.status !== 'Validated') && (() => {
                    // Find the flagging item and its key (docType)
                    const entry = Object.entries(consignment.roadmap).find(([_, item]: [string, any]) => item.analysis?.routeMismatch);
                    if (!entry) return null;

                    const [flaggingDocType, flaggingItem] = entry as [string, any];
                    const detectedOrigin = flaggingItem.analysis.extractedOrigin;
                    const detectedDest = flaggingItem.analysis.extractedDestination;

                    return (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-amber-200 dark:border-amber-900/50">
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-6 text-center border-b border-amber-100 dark:border-amber-900/30">
                                    <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-300 rounded-full flex items-center justify-center mb-4 ring-8 ring-amber-50/50 dark:ring-amber-900/20">
                                        <MapPin size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100">Route Mismatch Detected</h3>
                                    <p className="text-amber-700 dark:text-amber-400 mt-2 text-sm font-medium">
                                        The document you uploaded indicates a different trade route than what you originally selected.
                                    </p>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 opacity-60">
                                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Your Selection</p>
                                            <div className="flex flex-col gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                                <span>{consignment.exportFrom}</span>
                                                <span className="text-slate-400 dark:text-slate-600 text-xs text-center">↓</span>
                                                <span>{consignment.importTo}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10">
                                            <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">Document Shows</p>
                                            <div className="flex flex-col gap-1 font-bold text-amber-900 dark:text-amber-100">
                                                <span>{detectedOrigin || 'Unknown'}</span>
                                                <span className="text-amber-400 dark:text-amber-600 text-xs text-center">↓</span>
                                                <span>{detectedDest || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                                        <Info className="shrink-0 mt-0.5" size={16} />
                                        <p className="font-medium">
                                            Updating the route is recommended to ensure the correct compliance checklist (e.g., Swiss vs. US regulations) is generated for this consignment.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                                    <button
                                        onClick={() => {
                                            // "No, Keep Original"
                                            setConfirmModal({
                                                isOpen: true,
                                                title: 'Warning',
                                                message: 'Keeping the original route may result in incorrect compliance requirements. Are you sure?',
                                                confirmText: 'Yes, Keep Original',
                                                cancelText: 'Back',
                                                variant: 'warning',
                                                onConfirm: () => {
                                                    closeConfirm();
                                                    window.location.reload();
                                                }
                                            });
                                        }}
                                        className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    >
                                        Keep Original
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (detectedOrigin && detectedDest) {
                                                setLoading(true);
                                                try {
                                                    await consignmentService.updateConsignmentRoute(
                                                        consignment.id,
                                                        detectedOrigin,
                                                        detectedDest,
                                                        flaggingItem.analysis,
                                                        flaggingDocType // NEW: Pass the docType to fix it in DB
                                                    );

                                                    // 1. Update Core Route locally
                                                    setExportFrom(detectedOrigin);
                                                    setImportTo(detectedDest);

                                                    // 2. FORCE Local State Update to Close Modal Instantly
                                                    // Deep clone the consignment to avoid reference issues
                                                    const updatedConsignment = JSON.parse(JSON.stringify(consignment));

                                                    // Update the specific document that caused the flag
                                                    if (updatedConsignment.roadmap && updatedConsignment.roadmap[flaggingDocType]) {
                                                        const item = updatedConsignment.roadmap[flaggingDocType];
                                                        if (item.analysis) {
                                                            item.analysis.routeMismatch = false; // This kills the modal condition

                                                            // Optimistically update status (mimicking service logic)
                                                            const hasHandwritten = item.analysis.securityAnalysis?.handwrittenModifications;
                                                            const hasHighTamper = item.analysis.securityAnalysis?.tamperScore > 40;

                                                            if (!hasHandwritten && !hasHighTamper) {
                                                                item.status = 'Validated';
                                                                item.analysis.validationLevel = 'GREEN';
                                                            }
                                                        }
                                                    }

                                                    // Set state immediately to hide modal
                                                    setConsignment(updatedConsignment);

                                                    // 3. Background: Fetch fresh server state to be sure
                                                    const fresh = await consignmentService.getConsignment(consignment.id);
                                                    if (fresh) setConsignment(fresh);

                                                } catch (e) {
                                                    console.error("Failed to update route:", e);
                                                    alert("Update failed. Please try again.");
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                        }}
                                        disabled={!detectedOrigin || !detectedDest}
                                        className="flex-[2] px-4 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-lg shadow-amber-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
                                        Yes, Update Route
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()
            }

            {/* Document Preview Modal (Unified for Upload & View) */}
            {/* Modal Layer */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                cancelText={confirmModal.cancelText}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
            />

            <DocumentPreviewModal
                isOpen={!!previewUrl}
                onClose={handleCancelPreview}
                title={pendingDocType || 'Document Preview'}
                file={previewFile}
                fileUrl={previewUrl}
                isLoading={loading}
                onConfirm={handleConfirmUpload}
                showActions={!!previewFile} // Only show "Analyze & Upload" for local files
                status={consignment?.roadmap?.[pendingDocType || '']?.status}
                mimeType={previewMimeType}
            />

        </div>
    );
};

export default RegisterConsignment;
