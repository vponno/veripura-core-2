import { GoogleGenAI, Type } from "@google/genai";
import { DocumentAnalysisProvider, AnalysisOptions, AnalysisResult } from '../types';
import { ChecklistItemStatus } from '../../../../types';

// ... (existing code)

// Hydrate fields - REMOVED to allow AI auto-detection
// parsed.extractedData.originCountry = fromCountry;
// parsed.extractedData.destinationCountry = toCountry;

// Robust API Key Retrieval
const getApiKey = () => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) {
        return (import.meta as any).env.VITE_GEMINI_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env) {
        return process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    }
    return '';
};

// Helper to construct inline data part
const fileToPart = (base64: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64,
            mimeType,
        },
    };
};

// Define Schema using Type enum from specialized SDK
const complianceSchema = {
    type: Type.OBJECT,
    properties: {
        extractedData: {
            type: Type.OBJECT,
            properties: {
                sellerName: { type: Type.STRING, description: "Name of the seller/exporter." },
                buyerName: { type: Type.STRING, description: "Name of the buyer/importer." },
                originCountry: { type: Type.STRING, description: "The country of origin for the export." },
                destinationCountry: { type: Type.STRING, description: "The final destination country for the import." },
                products: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Name of the product." },
                            quantity: { type: Type.STRING, description: "Quantity of the product." },
                            hsCode: { type: Type.STRING, description: "8-10 digit HS Code." },
                            isOrganic: { type: Type.BOOLEAN, description: "True if Organic." },
                            attributes: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "Method of production/state: Frozen, Fresh, Dried, Roasted, Organic, Fairtrade, Halal, Kosher, Wild Caught, Aquaculture, Ready-to-Eat."
                            }
                        },
                        required: ['name', 'quantity', 'hsCode', 'isOrganic']
                    }
                },
                securityAnalysis: {
                    type: Type.OBJECT,
                    properties: {
                        isSuspicious: { type: Type.BOOLEAN, description: "True if suspicious." },
                        suspicionReason: { type: Type.STRING, description: "Reason for score." },
                        tamperScore: { type: Type.INTEGER, description: "0-100 score." }
                    },
                    required: ['isSuspicious', 'suspicionReason', 'tamperScore']
                }
            },
            required: ['sellerName', 'buyerName', 'originCountry', 'destinationCountry', 'products', 'securityAnalysis']
        },
        checklist: {
            type: Type.ARRAY,
            description: "List of required documents.",
            items: {
                type: Type.OBJECT,
                properties: {
                    documentName: { type: Type.STRING, description: "Official legal name of the document." },
                    description: { type: Type.STRING, description: "Why is it needed?" },
                    issuingAgency: { type: Type.STRING, description: "Specific government agency." },
                    agencyLink: { type: Type.STRING, description: "Official .gov URL." },
                    category: { type: Type.STRING, description: "One of: Logistics, Customs, Certifications, Regulatory, Financial." },
                    isMandatory: { type: Type.BOOLEAN, description: "True if legally required for entry. False if optional/best practice/commercial." }
                },
                required: ['documentName', 'description', 'issuingAgency', 'agencyLink', 'category', 'isMandatory']
            }
        }
    },
    required: ['extractedData', 'checklist']
};

export class GeminiProvider implements DocumentAnalysisProvider {
    name = 'Gemini';
    private ai: GoogleGenAI;

    constructor() {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.error("API Key not found. Please set VITE_GEMINI_API_KEY.");
        }
        this.ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
    }

    async analyze(fileBase64: string, mimeType: string, options: AnalysisOptions): Promise<AnalysisResult> {
        const { fromCountry, toCountry } = options;

        const prompt = `
    You are the Senior Trade Compliance Officer for **${toCountry}**.
    
    You are enforcing the specific Import Regulations of **${toCountry}**.
    If the destination is an EU Member State (e.g., France, Germany, Netherlands), you MUST cite the **National Competent Authority** (e.g., ANSES for France, NVWA for Netherlands, BVL for Germany) and National rules.

    Analyze the provided document (Purchase Order) for a shipment from ${fromCountry} to ${toCountry}.

    1. **Forensics**: Check for tampering/AI generation.
    2. **Extraction**: Identify Seller, Buyer, Products (with HS Codes).
    3. **Attributes**: For each product, extract attributes if they appear in description or are implied: "Frozen", "Fresh/Chilled", "Dried", "Roasted", "Organic", "Fairtrade", "Halal", "Kosher", "Wild Caught", "Aquaculture", "Ready-to-Eat".
    4. **Compliance Checklist**:
       Generate a document list split by **MANDATORY** (Strict legal requirement for entry) vs **ADVISED** (Recommended, best practice, or conditional commercial requirement).
       
       **CATEGORIZATION RULES**:
       - **Logistics**: Bill of Lading, Packing List.
       - **Financial**: Commercial Invoice.
       - **Customs**: Import Declaration (CBP 7501, SAD), Valuation Form.
       - **Regulatory**: Health Certificate, Phytosanitary Certificate.
       - **Certifications**: Organic Cert, Halal Cert, Catch Cert.

       **LOGIC FOR MANDATORY vs ADVISED**:
       - Core Customs/Logistics docs (Invoice, PL, BL, Import Declaration) are **ALWAYS MANDATORY**.
       - **Organic Certificate**: MANDATORY if product is Organic AND destination has organic law.
       - **Phytosanitary/Health Cert**: MANDATORY if product is plant/animal.
       - **Halal/Kosher**: MANDATORY for specific destinations (e.g. UAE/Saudi Arabia for Halal), otherwise **ADVISED** if product claims to be Halal/Kosher.
       - **Quality/Test Reports**: Usually **ADVISED** unless specific safety regulation cites it.
       - **Origin Cert**: MANDATORY for Preferential Tariffs, otherwise ADVISED.

       For each document:
       - **documentName**: Official legal name.
       - **issuingAgency**: Specific national agency.
       - **agencyLink**: Official URL.
       - **isMandatory**: BOOLEAN (true/false).

    Your response must be a single JSON object matching the schema.
    `;

        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-3.0-flash",
                contents: [
                    {
                        parts: [
                            fileToPart(fileBase64, mimeType),
                            { text: prompt }
                        ]
                    }
                ],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: complianceSchema
                }
            });

            // The response structure for @google/genai might differ slightly
            const jsonText = response.text;
            if (!jsonText) throw new Error("Empty response from AI");

            const parsed = JSON.parse(jsonText);

            // Hydrate fields
            parsed.extractedData.originCountry = fromCountry;
            parsed.extractedData.destinationCountry = toCountry;

            // Map raw checklist to ChecklistItems with ID/Status
            const checklistItems = parsed.checklist.map((item: any, idx: number) => ({
                ...item,
                id: `gemini-auto-${idx}-${Date.now()}`,
                status: ChecklistItemStatus.MISSING
            }));

            return {
                extractedData: parsed.extractedData,
                checklist: checklistItems
            };
        } catch (e) {
            console.error("Gemini Analysis Error:", e);
            throw e;
        }
    }
}
