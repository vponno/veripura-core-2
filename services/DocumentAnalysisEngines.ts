
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ComplianceDocument } from "../types";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { logger } from './lib/logger';

// --- Interfaces ---

export interface AnalysisEngine {
    name: string;
    description: string;
    analyzeDocument(file: File, context?: { exportFrom: string, importTo: string }): Promise<any>;
    extractTradeDna(file: File): Promise<any>;
}

// --- Configuration & Schemas (Moved from validationService) ---

// Safe environment variable retrieval
const getApiKey = () => {
    // 1. Vite Environment
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    // 2. Node/Webpack Environment
    if (typeof process !== 'undefined' && process.env) {
        return process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    }
    return undefined;
};

const API_KEY = getApiKey();

if (!API_KEY) {
    logger.warn("VITE_GEMINI_API_KEY is not set. Engines dependent on Gemini will fail.");
}

// Initialize the standard SDK as before (for non-LlamaParse tasks)
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g. "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

// Re-using the schemas defined in the original service
const VALIDATION_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        // Document Classification
        documentType: { type: Type.STRING, description: "Type of document (e.g., Purchase Order, Invoice, Bill of Lading)" },
        documentId: { type: Type.STRING, description: "Document ID or reference number" },
        date: { type: Type.STRING, description: "Document date" },

        // Parties
        issuer: { type: Type.STRING, description: "Name of the seller/exporter" },
        recipient: { type: Type.STRING, description: "Name of the buyer/importer" },

        // Summary
        summary: { type: Type.STRING, description: "Brief 2-sentence summary of the document" },

        // Products with HS Codes and Organic Status
        products: {
            type: Type.ARRAY,
            description: "List of products extracted from the document",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Product name" },
                    quantity: { type: Type.STRING, description: "Quantity (e.g., '100kg', '50 units')" },
                    packaging: { type: Type.STRING, description: "Packaging details (e.g., '200 Cartons', '10 Pallets')" },
                    volume: { type: Type.STRING, description: "Volume (e.g., '10 cbm')" },
                    grossWeight: { type: Type.STRING, description: "Gross Weight (e.g., '5200 kg')" },
                    hsCode: { type: Type.STRING, description: "8-10 digit HS/Tariff code for destination country" },
                    isOrganic: { type: Type.BOOLEAN, description: "True if product is described as organic" },
                    unitValue: { type: Type.STRING, description: "Unit price if available" }
                },
                required: ['name', 'quantity', 'hsCode', 'isOrganic']
            }
        },

        // Security & Forensics Analysis
        securityAnalysis: {
            type: Type.OBJECT,
            description: "Document security and tampering analysis",
            properties: {
                isSuspicious: { type: Type.BOOLEAN, description: "True if visual anomalies or signs of tampering detected" },
                tamperScore: { type: Type.INTEGER, description: "0-100 score (0=Clean, 100=Highly Suspicious)" },
                suspicionReason: { type: Type.STRING, description: "Detailed explanation or 'Document appears authentic'" },
                aiGenerationDetected: { type: Type.BOOLEAN, description: "True if document appears AI-generated" },
                fontConsistency: { type: Type.BOOLEAN, description: "True if fonts are consistent throughout" },
                signaturePresent: { type: Type.BOOLEAN, description: "True if official signature/stamp is present" },
                // Handwritten Modification Detection
                handwrittenModifications: { type: Type.BOOLEAN, description: "True if handwritten changes/corrections found on typed content" },
                handwrittenDetails: { type: Type.STRING, description: "Description of handwritten edits (e.g., 'Quantity crossed out and rewritten', 'Manual date correction')" },
                inkConsistency: { type: Type.BOOLEAN, description: "True if all handwritten parts use same ink color/style" },
                crossedOutText: { type: Type.BOOLEAN, description: "True if any text has been crossed out or struck through" }
            },
            required: ['isSuspicious', 'tamperScore', 'suspicionReason', 'handwrittenModifications']
        },

        // Certification Metadata (New for Phase 1 Validation)
        certificationMetadata: {
            type: Type.OBJECT,
            description: "If this is a certificate (Organic, ISO, Food Safety), extract strict validity details.",
            properties: {
                isCertificate: { type: Type.BOOLEAN, description: "True if document is a certificate/license" },
                certificateNumber: { type: Type.STRING },
                validFrom: { type: Type.STRING, description: "Effective start date (YYYY-MM-DD)" },
                validUntil: { type: Type.STRING, description: "Expiration date (YYYY-MM-DD)" },
                issuingBody: { type: Type.STRING, description: "Authority that issued it (e.g., 'EcoCert', 'SGS')" },
                holderName: { type: Type.STRING, description: "Company name the certificate is issued to" },
                certifiedScope: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of products or activities covered by this certificate"
                },
                validationErrors: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Specific certification errors (e.g., 'Expired', 'Holder Mismatch', 'Scope Mismatch')"
                }
            },
            required: ['isCertificate']
        },

        // Extraction for RAG/BigQuery Context
        hsCodeContext: {
            type: Type.OBJECT,
            description: "Context for future regulatory lookup",
            properties: {
                primaryHsCode: { type: Type.STRING, description: "Dominant HS Code extracted" },
                destinationMarket: { type: Type.STRING, description: "Target market (EU, USA, etc.)" },
                detectedProductCategory: { type: Type.STRING, description: "e.g., 'Seafood', 'Coffee', 'Fresh Fruit'" }
            }
        },

        // Validation Checks
        validationChecks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    check: { type: Type.STRING },
                    passed: { type: Type.BOOLEAN },
                    reason: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ['Critical', 'Warning', 'Info'] }
                }
            }
        },

        // Scores
        confidenceScore: { type: Type.NUMBER, description: "Overall confidence in document validity (0-1)" },
        organicStatus: { type: Type.STRING, enum: ['Certified', 'Not Certified', 'Pending', 'N/A'] },
        validationLevel: { type: Type.STRING, enum: ['GREEN', 'YELLOW', 'RED'] },

        // Route Mismatch Detection
        extractedOrigin: { type: Type.STRING, description: "Origin country extracted from document content" },
        extractedDestination: { type: Type.STRING, description: "Destination country extracted from document content" },
        routeMismatch: {
            type: Type.BOOLEAN,
            description: "True if document's origin/destination differs from selected route"
        },
        routeMismatchWarning: {
            type: Type.STRING,
            description: "Warning message if route mismatch detected, or empty if matches"
        },

        // Compliance Checklist with Agency Links
        requiredNextDocuments: {
            type: Type.ARRAY,
            description: "Comprehensive compliance checklist with agency information",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Official document name" },
                    description: { type: Type.STRING, description: "Brief explanation of what this document is for" },
                    issuingAgency: { type: Type.STRING, description: "Government agency or authority that issues this document" },
                    agencyLink: { type: Type.STRING, description: "URL to agency website or application form (use 'N/A' if not available)" },
                    category: { type: Type.STRING, enum: ['Customs', 'Regulatory', 'Food Safety', 'Organic', 'Transport', 'Other'] },
                    status: { type: Type.STRING, enum: ['Pending', 'Uploaded'] },
                    isMandatory: { type: Type.BOOLEAN, description: "True if legally required, False if optional/advised" }
                },
                required: ['name', 'description', 'issuingAgency', 'agencyLink', 'category', 'status', 'isMandatory']
            }
        }
    },
    required: ["documentType", "products", "securityAnalysis", "certificationMetadata", "hsCodeContext", "validationChecks", "validationLevel", "confidenceScore", "routeMismatch", "requiredNextDocuments"]
};

const DNA_SCHEMA: Schema = {
    type: Type.OBJECT,
    properties: {
        originCountry: { type: Type.STRING },
        destinationCountry: { type: Type.STRING },
        products: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    packaging: { type: Type.STRING, description: "e.g. 200 Cartons" },
                    volume: { type: Type.STRING, description: "e.g. 10 cbm" },
                    grossWeight: { type: Type.STRING, description: "e.g. 5200 kg" },
                    hsCode: { type: Type.STRING, description: "6-digit HS Code" },
                    attributes: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Detected attributes: Frozen, Organic, Wild Caught, Fresh, Dried, Roasted"
                    }
                }
            }
        },
        securityAnalysis: {
            type: Type.OBJECT,
            description: "Document forensic analysis",
            properties: {
                isSuspicious: { type: Type.BOOLEAN, description: "True if visual anomalies or signs of tampering detected" },
                tamperScore: { type: Type.INTEGER, description: "0-100 score (0=Clean, 100=Highly Suspicious)" },
                suspicionReason: { type: Type.STRING, description: "Explanation of findings" },
                handwrittenModifications: { type: Type.BOOLEAN, description: "True if handwritten changes found" },
                aiGenerationDetected: { type: Type.BOOLEAN, description: "True if document appears AI-generated" }
            },
            required: ['isSuspicious', 'tamperScore', 'handwrittenModifications']
        }
    },
    required: ['originCountry', 'destinationCountry', 'products', 'securityAnalysis']
};

// --- Engine Implementations ---

export class GeminiV3Engine implements AnalysisEngine {
    name = "VeriPura Oracle (Gemini V3)";
    description = "Multimodal AI engine with native vision and forensic auditing capabilities.";
    private ai: GoogleGenAI;

    constructor() {
        this.ai = new GoogleGenAI({ apiKey: API_KEY || '' });
    }

    async analyzeDocument(file: File, context?: { exportFrom: string, importTo: string }): Promise<any> {
        const base64Data = await fileToBase64(file);
        const today = new Date().toISOString().split('T')[0];

        const prompt = `You are VeriPura™ AI, an expert in international food trade compliance and document forensics.
            
TRADE ROUTE CONTEXT:
- Origin Country: ${context?.exportFrom || 'Unknown'} (Full Name, e.g. "Switzerland" not "CH")
- Destination Country: ${context?.importTo || 'Unknown'} (Full Name, e.g. "China" not "CN")
- Current Date: ${today}

Analyze the provided document and perform these comprehensive tasks:

## 1. SECURITY & FORENSICS CHECK
Analyze visual document for signs of tampering, edits, or AI generation:
- **CRITICAL:** Detect ANY handwritten changes, manual corrections, or manual signatures on typed values (quantities, dates, prices).
- **Pixel Analysis:** Look for mismatched fonts, inconsistent noise patterns, or "cut-and-paste" artifacts indicating pixel manipulation (common in certificate fraud).
- Check for logical inconsistencies (dates that don't match, prices that don't sum up).
- Provide a 'tamperScore' (0-100).
- If handwriting is found, set 'handwrittenModifications' to true and describe exactly what was manual.

## 2. CERTIFICATION & PRODUCT MATCHING
If this is a CERTIFICATE (Organic, ISO, Health, Phytosanitary), apply STRICT reconciliation:
- **Product Mismatch Detection:** Does the product on the certificate (scope/name) match the actual shipment products? If the certificate is for "Coffee" but the shipment is "Cocoa", flag as "Product Mismatch".
- **Date Validity:** Extract 'validFrom' and 'validUntil'. COMPARE against Current Date (${today}).
  - If validUntil < ${today}, sets isCertificate=true and ADD "Expired Certificate" to validationErrors.
- **Holder Check:** Extract 'holderName'. Does it match the Exporter context? If not, ADD "Holder Name Mismatch".
- **Scope Check:** Extract 'certifiedScope'. Do the products in this shipment match the scope? If not, ADD "Product not in Scope".

## 3. EXTRACT KEY INFORMATION & HS CODES
- Document Type, ID, Issue Date.
- **HS Codes:** Extract the Harmonized System code for each product.
- **Organic Status:** Is this specific lot certified organic?

## 4. ROUTE MISMATCH DETECTION
- Compare extracted Origin/Destination with User Selected (${context?.exportFrom} -> ${context?.importTo}).
- If different -> routeMismatch=true.

## 5. COMPLIANCE CASCADING (RAG PREP)
Based on the **Extracted HS Code** and **Destination**:
- Which specific documents are required?
- **Logic for Organic:** ONLY list "Organic Transaction Certificate" IF the product is explicitly detected as Organic in Part 3. If not Organic, DO NOT include it.
- Example: If Coffee (0901) -> EU: Check EUDR.
- Example: If Shrimp (0306) -> USA: Check Antibiotic Test, HACCP, catch certificate.
- List these in 'requiredNextDocuments' with REAL agency links.

## 6. VALIDATION CHECKS SUMMARY
Generate a list of specific checks (passed/failed):
- "Handwritten Modification Check"
- "Product Integrity Match"
- "Certificate Expiry Check"
- "Holder Name Match"
- "Scope Verification"
- "Route Consistency"

Assign overall validationLevel:
- **RED:** Expired, Tampered, Product Mismatch, Critical Route Mismatch.
- **YELLOW:** Suspicious, Minor Handwritten Mods, Missing optional info.
- **GREEN:** Authentic, Valid Dates, Matches Context.`;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: file.type, data: base64Data } },
                        { text: prompt }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: VALIDATION_SCHEMA,
                    temperature: 0.0
                }
            });

            const text = response.text;
            if (!text) throw new Error("No response from VeriPura™ AI");
            return JSON.parse(text);
        } catch (e: any) {
            console.error("Gemini V3 Analysis Failed:", e.message);
            throw e;
        }
    }

    async extractTradeDna(file: File): Promise<any> {
        const base64Data = await fileToBase64(file);
        const prompt = `You are the VeriPura Oracle. Analyze this Purchase Order or Invoice.
        
        PART 1: DATA EXTRACTION ("The DNA")
        Extract:
        1. Origin Country (Exporter's location) - ALWAYS use Full Country Name (e.g. "Switzerland", never "CH")
        2. Destination Country (Importer's location) - ALWAYS use Full Country Name (e.g. "China", never "CN")
        3. For each line item:
           - Predict the 6-digit HS Code (e.g. '030617').
           - Detect key Attributes (e.g. 'Frozen', 'Organic').

        PART 2: FORENSIC SECURITY CHECK
        Analyze the visual document for fraud:
        1. **Tampering**: Look for mismatched fonts, cut-and-paste lines, or pixel inconsistencies in DATE or PRICE fields.
        2. **Handwriting**: Are there manual overrides on key values?
        3. **AI Generation**: Does the document look synthetically generated?
        4. Provide a 'tamperScore' (0-100).
        `;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: file.type, data: base64Data } },
                        { text: prompt }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: DNA_SCHEMA,
                    temperature: 0.0
                }
            });
            return JSON.parse(response.text || '{}');
        } catch (e) {
            console.error("Gemini V3 Extraction Failed:", e);
            throw e;
        }
    }
}

export class StandardOCREngine implements AnalysisEngine {
    name = "Standard OCR (Mock/Tesseract)";
    description = "Traditional OCR + Text-only LLM. Best for high-volume, low-fraud risk documents.";

    async analyzeDocument(file: File, context?: { exportFrom: string, importTo: string }): Promise<any> {
        // In a real implementation:
        // 1. Send file to OCR Service (Textract, DocumentAI, or Tesseract) -> Get raw text
        // 2. Send raw text to Text-Only LLM (GPT-4o, Gemini Flash Text, etc.) with the prompt

        console.warn("StandardOCREngine is a placeholder. Returning simulated data.");

        // Simulating 2s delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            documentType: "Mock Document (Standard Engine)",
            confidenceScore: 0.85,
            validationLevel: "YELLOW",
            validationChecks: [
                { check: "OCR Quality", passed: true, reason: "Text extracted successfully", severity: "Info" },
                { check: "Fraud Check", passed: false, reason: "Standard OCR cannot detect pixel tampering", severity: "Warning" }
            ],
            requiredNextDocuments: [],
            products: [],
            securityAnalysis: {
                isSuspicious: false,
                tamperScore: 0,
                suspicionReason: "Not checked by Forensic Engine",
                handwrittenModifications: false
            }
        };
    }

    async extractTradeDna(file: File): Promise<any> {
        console.warn("StandardOCREngine extractTradeDna placeholder.");
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            originCountry: "Unknown (Standard Engine)",
            destinationCountry: "Unknown (Standard Engine)",
            products: [],
            securityAnalysis: { isSuspicious: false, tamperScore: 0, handwrittenModifications: false }
        };
    }
}
