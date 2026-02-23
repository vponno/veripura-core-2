import { GoogleGenAI, Type } from "@google/genai";
import { ComplianceDocument } from "../types";
import { Consignment } from './consignmentService';
import { httpsCallable } from "firebase/functions";
import { functions } from "./lib/firebase";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set. Compliance checks will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

// Schema for Gemini Response
const complianceSchema = {
    type: Type.OBJECT,
    properties: {
        documents: {
            type: Type.ARRAY,
            description: "List of required documents for trade compliance.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Official name of the document." },
                    category: { type: Type.STRING, description: "Category: Customs, Food Safety, Regulatory, or Logistics." },
                    description: { type: Type.STRING, description: "Brief explanation of why it is needed." },
                    issuingAgency: { type: Type.STRING, description: "Authority that issues this document." }
                },
                required: ["name", "category", "description"]
            }
        }
    },
    required: ["documents"]
};

export interface ValidationRuleResult {
    ruleId: string;
    regulation: string;
    description: string;
    passed: boolean;
    missingDocuments: string[];
    criticality?: 'Blocking' | 'Warning';
}

export const complianceService = {
    /**
     * Maps a document type or category to the responsible Guardian Agent.
     * Source: agents_overview.md
     */
    getResponsibleAgent: (docName: string, category: string): string => {
        const normalize = (s: string) => s.toLowerCase();
        const name = normalize(docName);
        const cat = normalize(category);

        // 1. Specific Documents
        if (name.includes('organic') || name.includes('transaction certificate')) return 'Organic Sentinel';
        if (name.includes('phytosanitary') || name.includes('health cert')) return 'Vet & SPS Expert';
        if (name.includes('halal') || name.includes('kosher')) return 'Halal/Kosher Guardian';
        if (name.includes('bill of lading') || name.includes('waybill')) return 'Chain of Custody Auditor';
        if (name.includes('invoice') || name.includes('packing list')) return 'Consignment Guardian'; // General oversight
        if (name.includes('certificate of analysis') || name.includes('lab report')) return 'Lab Result Validator';
        if (name.includes('insurance')) return 'Insurance Validator';
        if (name.includes('origin')) return 'Tariff Optimizer'; // Or Customs Agent

        // 2. Categories
        if (cat.includes('food safety')) return 'Food Safety Auditor';
        if (cat.includes('regulatory') || cat.includes('customs')) return 'Tariff Optimizer';
        if (cat.includes('transport') || cat.includes('logistics')) return 'Logistics Lingo Interpreter';
        if (cat.includes('sustainability') || cat.includes('ethical')) return 'Ethical Sourcing Specialist';

        // 3. Default
        return 'Consignment Guardian';
    },

    getRequiredDocuments: async (product: string, origin: string, destination: string, hsCode?: string): Promise<ComplianceDocument[]> => {
        try {
            if (!API_KEY) throw new Error("API Key missing");

            const prompt = `
        You are an expert Trade Compliance Officer.
        Analyze the trade route and product:
- Product: ${product}
- HS Code: ${hsCode || 'Not provided'}
- Origin: ${origin}
- Destination: ${destination}

        List all required documents for this specific international shipment.
        - "Certificates": (e.g., Health, Phytosanitary, Origin, Halal, Organic)
        - "Commercial": (e.g., Invoice, Packing List, PO, Bill of Lading, Insurance)
        - "Regulatory": (e.g., Import Licenses, Permits, Customs Declarations)
        - "Other": Any document that does not fit the above categories.

        For each document, specify if it is "Mandatory" (Legal requirement) or "Advised".

        Return a generic list that applies to this trade.
      `;

            const response = await ai.models.generateContent({
                model: 'gemini-3.0-flash', // Fast model
                contents: {
                    role: 'user',
                    parts: [{ text: prompt }]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            documents: {
                                type: Type.ARRAY,
                                description: "List of required documents for trade compliance.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING, description: "Official name of the document." },
                                        category: { type: Type.STRING, description: "Must be one of: 'Certificates', 'Commercial', 'Regulatory', 'Other'" },
                                        description: { type: Type.STRING, description: "Brief explanation of why it is needed." },
                                        issuingAgency: { type: Type.STRING, description: "Authority that issues this document." },
                                        isMandatory: { type: Type.BOOLEAN, description: "True if legally required, False if just best practice/advised." }
                                    },
                                    required: ["name", "category", "description", "isMandatory"]
                                }
                            }
                        },
                        required: ["documents"]
                    }
                }
            });

            const text = response.text;
            if (!text) throw new Error("No response from AI");

            const data = JSON.parse(text);

            const aiDocs = data.documents.map((doc: any) => ({
                name: doc.name,
                category: doc.category,
                description: doc.description,
                isMandatory: doc.isMandatory ?? true, // AI opinion
                status: 'MISSING',
                source: 'AI',
                issuingAgency: complianceService.getResponsibleAgent(doc.name, doc.category)
            })) as ComplianceDocument[];

            // --- MERGE WITH STATIC RULES ---
            try {
                // Dynamic import for rules
                const rulesModule = await import('./rules/complianceRules.json');
                const localRules = rulesModule.default as any[];

                const normalize = (s: string) => s ? s.toLowerCase().trim() : '';

                const matchedRules = localRules.filter(r => {
                    // Check Product Match (Naive string check for now)
                    const prodMatch = r.product_category === 'General' || normalize(product).includes(normalize(r.product_category));
                    // Check Origin
                    const originMatch = r.origin === 'any' || normalize(origin).includes(normalize(r.origin));
                    // Check Dest
                    const destMatch = r.destination === 'any' || normalize(destination).includes(normalize(r.destination));

                    return prodMatch && originMatch && destMatch;
                });

                // Map of DocName -> Doc for deduplication
                const docMap = new Map<string, ComplianceDocument>();

                // 1. Add AI Docs first
                aiDocs.forEach(d => docMap.set(d.name, d));

                // 2. Overlay Static Rules (Override isMandatory if needed)
                matchedRules.forEach(rule => {
                    rule.required_documents.forEach((reqDoc: any) => {
                        const existing = docMap.get(reqDoc.name);
                        const responsibleAgent = complianceService.getResponsibleAgent(reqDoc.name, reqDoc.category || 'Regulatory');

                        if (existing) {
                            // Force mandatory if rule says so
                            if (reqDoc.isMandatory) existing.isMandatory = true;
                            existing.issuingAgency = responsibleAgent;
                        } else {
                            // Add new doc from rule
                            docMap.set(reqDoc.name, {
                                name: reqDoc.name,
                                category: reqDoc.category,
                                description: reqDoc.description,
                                isMandatory: reqDoc.isMandatory ?? true,
                                status: 'MISSING',
                                issuingAgency: responsibleAgent // Was 'Rule-Based Requirement'
                            });
                        }
                    });
                });

                // 3. Explicit "BIO" / "Organic" Keyword Check (User Request)
                const isOrganic = normalize(product).includes('bio ') ||
                    normalize(product).includes('organic') ||
                    normalize(product).startsWith('bio ');

                if (isOrganic) {
                    const organicDocName = "Organic Certificate";
                    if (!docMap.has(organicDocName)) {
                        docMap.set(organicDocName, {
                            name: organicDocName,
                            category: "Certificates",
                            description: "Required for products labeled as BIO or Organic.",
                            isMandatory: true,
                            status: 'MISSING',
                            issuingAgency: "Organic Sentinel",
                            source: 'Rule-Based Requirement'
                        });
                    } else {
                        // Ensure it is mandatory if found
                        const existing = docMap.get(organicDocName)!;
                        existing.isMandatory = true;
                        existing.issuingAgency = "Organic Sentinel";
                    }
                }

                // 4. Global Mandatory Requirement: Bill of Lading (User Request)
                // This must ALWAYS be present and Mandatory for every international shipment.
                const blName = "Bill of Lading";
                // Note: Could also be "Air Waybill" for air freight, but sticking to "Bill of Lading" as generic mandatory term per request.

                if (!docMap.has(blName)) {
                    docMap.set(blName, {
                        name: blName,
                        category: "Commercial",
                        description: "Mandatory transport document for all international shipments.",
                        isMandatory: true,
                        status: 'MISSING',
                        issuingAgency: "Chain of Custody Auditor",
                        source: 'Global Policy'
                    });
                } else {
                    const existing = docMap.get(blName)!;
                    existing.isMandatory = true;
                    existing.source = 'Global Policy'; // Override source to indicate high priority
                    existing.issuingAgency = "Chain of Custody Auditor";
                }

                return Array.from(docMap.values());

            } catch (ruleError) {
                console.warn("Static rule merge failed, returning AI docs only:", ruleError);
                return aiDocs;
            }

        } catch (error) {
            console.error("Compliance Check Failed:", error);
            // Fallback or rethrow
            return [];
        }
    },

    /**
     * Advanced Hybrid Validation Engine.
     * 1. Checks Local Rule Matrix (Fast, Offline-first)
     * 2. Checks Cloud Function (BigQuery Source of Truth)
     */
    validateConsignmentRules: async (consignment: Consignment): Promise<ValidationRuleResult[]> => {
        const results: ValidationRuleResult[] = [];
        const roadmapDocs = Object.keys(consignment.roadmap || {});

        // Extract Product Logic (Hoisted for Shared Access)
        const extractedProduct = Object.values(consignment.roadmap || {})
            .map((d: any) => d.analysis?.products?.[0]?.name)
            .find(p => p) || 'General';

        // --- 1. LOCAL CHECK (Instant) ---
        try {
            // Dynamic import to avoid bundling issues if file is missing in some envs
            const rulesModule = await import('./rules/complianceRules.json');
            const localRules = rulesModule.default as any[];

            // Filter relevant rules with flexible country matching
            // Attempt to find extracted product name from roadmap analysis
            const extractedProduct = Object.values(consignment.roadmap || {})
                .map((d: any) => d.analysis?.products?.[0]?.name)
                .find(p => p) || 'General';

            // Filter relevant rules with flexible country matching
            const normalize = (s: string) => s ? s.toLowerCase().trim() : '';

            const relevantLocalRules = localRules.filter(r => {
                const ruleOrigin = normalize(r.origin);
                const ruleDest = normalize(r.destination);
                const portOrigin = normalize(consignment.exportFrom);
                const portDest = normalize(consignment.importTo);

                // Check Origin: ANY, Exact Match, or Partial Match (e.g. "China" in "P.R. China")
                const isOriginMatch = ruleOrigin === 'any' ||
                    portOrigin === ruleOrigin ||
                    portOrigin.includes(ruleOrigin) ||
                    ruleOrigin.includes(portOrigin);

                // Check Destination: ANY, Exact Match, or Partial Match
                const isDestMatch = ruleDest === 'any' ||
                    portDest === ruleDest ||
                    portDest.includes(ruleDest) ||
                    ruleDest.includes(portDest) ||
                    (ruleDest === 'united states' && (portDest === 'usa' || portDest === 'us')) ||
                    (ruleDest === 'european union' && (portDest === 'eu' || portDest === 'europe'));

                // Check Product: Logic Updated to be dynamic
                const isProductMatch = r.product_category === 'ANY' ||
                    (extractedProduct !== 'General' && r.product_category.toLowerCase().includes(extractedProduct.toLowerCase()));

                return isOriginMatch && isDestMatch && isProductMatch;
            });

            relevantLocalRules.forEach(rule => {
                const missingDocs: string[] = [];
                rule.required_documents.forEach((reqDoc: string) => {
                    // Loose matching for document names
                    const isPresent = roadmapDocs.some(k =>
                        k.toLowerCase().includes(reqDoc.toLowerCase()) ||
                        reqDoc.toLowerCase().includes(k.toLowerCase())
                    );
                    if (!isPresent) missingDocs.push(reqDoc);
                });

                results.push({
                    ruleId: rule.rule_id,
                    regulation: rule.regulation,
                    description: rule.description,
                    passed: missingDocs.length === 0,
                    missingDocuments: missingDocs,
                    criticality: rule.criticality || 'Blocking'
                });
            });

        } catch (error) {
            console.warn("Local Rule Matrix not found or invalid. Skipping local check.");
        }

        // --- 2. CLOUD CHECK (BigQuery / Complex Logic) ---
        // Only trigger if we have connectivity or if local check isn't sufficient
        // For MVP, we wrap this safely so it doesn't block the UI if Cloud Function isn't deployed yet.
        // For MVP, we wrap this safely so it doesn't block the UI if Cloud Function isn't deployed yet.
        const getRules = httpsCallable(functions, 'getComplianceRules');

        try {
            const response = await getRules({
                origin: consignment.exportFrom,
                destination: consignment.importTo,
                product: extractedProduct // Dynamic from PO scan
            });

            const data = response.data as any;
            if (data && data.rules) {
                // Merge cloud rules, avoiding duplicates if they share IDs with local rules
                data.rules.forEach((cloudRule: any) => {
                    const existingIndex = results.findIndex(r => r.ruleId === cloudRule.ruleId);

                    const missingDocs: string[] = [];
                    cloudRule.required_documents.forEach((reqDoc: string) => {
                        const isPresent = roadmapDocs.some(k =>
                            k.toLowerCase().includes(reqDoc.toLowerCase()) ||
                            reqDoc.toLowerCase().includes(k.toLowerCase())
                        );
                        if (!isPresent) missingDocs.push(reqDoc);
                    });

                    const resultObj = {
                        ruleId: cloudRule.ruleId,
                        regulation: cloudRule.regulation,
                        description: cloudRule.description,
                        passed: missingDocs.length === 0,
                        missingDocuments: missingDocs
                    };

                    if (existingIndex !== -1) {
                        // Cloud rule overrides local rule (Source of Truth)
                        results[existingIndex] = resultObj;
                    } else {
                        results.push(resultObj);
                    }
                });
            }
        } catch (error) {
            console.warn("Cloud Compliance Check failed (may be offline or not deployed):", error);
            // Non-blocking failure - we still return local results
        }


        return results;
    },

    getHSCode: async (product: string): Promise<{ code: string, description: string }> => {
        try {
            if (!API_KEY) throw new Error("API Key missing");

            const prompt = `
        You are an expert Customs Broker.
        Identify the most likely Harmonized System (HS) Code (6-digit international standard) for the following product:
        Product: "${product}"

        Return the result in JSON format:
        {
            "code": "1234.56",
            "description": "Brief official description of this code"
        }
      `;

            const response = await ai.models.generateContent({
                model: 'gemini-3.0-flash',
                contents: {
                    role: 'user',
                    parts: [{ text: prompt }]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            code: { type: Type.STRING, description: "6-digit HS Code" },
                            description: { type: Type.STRING, description: "Official HS description" }
                        },
                        required: ["code", "description"]
                    }
                }
            });

            const text = response.text;
            if (!text) throw new Error("No response from AI");
            return JSON.parse(text);

        } catch (error) {
            console.error("HS Code Lookup Error:", error);
            return { code: "0000.00", description: "Lookup failed" };
        }
    }
};
