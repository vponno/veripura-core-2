import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedPOData, ChecklistItem, DocumentType } from '../../types';

// Lazy init to prevent crash on load if key is missing
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (aiInstance) return aiInstance;

  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("API_KEY environment variable not set. Please check your .env file.");
  }

  aiInstance = new GoogleGenAI({ apiKey: key });
  return aiInstance;
};

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

const extractionAndChecklistSchema = {
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
              quantity: { type: Type.STRING, description: "Quantity of the product (e.g., '100kg', '50 units')." },
              hsCode: { type: Type.STRING, description: "The most likely 8 or 10-digit Harmonized System (HS) or tariff code specific to the destination country." },
              isOrganic: { type: Type.BOOLEAN, description: "Set to true if the product is described as organic, otherwise false." }
            },
            required: ['name', 'quantity', 'hsCode', 'isOrganic']
          }
        },
        securityAnalysis: {
          type: Type.OBJECT,
          properties: {
            isSuspicious: { type: Type.BOOLEAN, description: "True if visual anomalies, mismatched fonts, or signs of AI generation/tampering are detected." },
            suspicionReason: { type: Type.STRING, description: "Detailed explanation of why the document looks suspicious or 'Clean' if no issues found." },
            tamperScore: { type: Type.INTEGER, description: "A score from 0 to 100 indicating likelihood of tampering (0 = Clean, 100 = Highly Suspicious)." }
          },
          required: ['isSuspicious', 'suspicionReason', 'tamperScore']
        }
      },
      required: ['sellerName', 'buyerName', 'originCountry', 'destinationCountry', 'products', 'securityAnalysis']
    },
    checklist: {
      type: Type.ARRAY,
      description: "A comprehensive compliance checklist.",
      items: {
        type: Type.OBJECT,
        properties: {
          documentName: { type: Type.STRING, description: "The official name of the required document or certification." },
          description: { type: Type.STRING, description: "A brief explanation of what this document is for." },
          issuingAgency: { type: Type.STRING, description: "The government agency or authority that issues this document." },
          agencyLink: { type: Type.STRING, description: "A URL to the agency's website or the specific form. Use 'N/A' if not available." },
          category: { type: Type.STRING, description: "Category of the requirement. Must be one of: 'Customs', 'Regulatory', 'Food Safety', 'Other'." }
        },
        required: ['documentName', 'description', 'issuingAgency', 'agencyLink', 'category']
      }
    }
  },
  required: ['extractedData', 'checklist']
};


export const generateComplianceChecklist = async (fileBase64: string, mimeType: string, fromCountry: string, toCountry: string): Promise<{ extractedData: ExtractedPOData, checklist: Omit<ChecklistItem, 'id' | 'status'>[] }> => {

  const imagePart = fileToGenerativePart(fileBase64, mimeType);

  const prompt = `You are an expert in international food trade compliance and document forensics. Analyze the provided document (Purchase Order, invoice, or product list) and the user-selected countries to perform three tasks:

1.  **Security & Forensics Check:** Analyze the visual document for signs of tampering, edits, or AI generation. Look for:
    *   Mismatched fonts or inconsistent noise patterns indicating cut-and-paste edits.
    *   Logical inconsistencies (e.g., dates that don't match, prices that don't sum up).
    *   Artifacts common in AI-generated fake documents (nonsense text in logos, impossible layouts).
    *   Provide a 'tamperScore' (0-100) and a reason. If it looks legitimate, score it 0-10 and state "Document appears authentic."

2.  **Extract Key Information:** Parse the document to identify the seller, buyer, and a list of all products with their quantities. For each product, determine its most likely 8 to 10-digit Harmonized System (HS) or tariff code, specific to the destination country. Also, identify if a product is explicitly described as 'organic' and set the corresponding boolean flag. If this info isn't in the document, use placeholder text like "N/A - from document". Use the user-provided country selection to populate origin and destination: Origin is ${fromCountry}, Destination is ${toCountry}.

3.  **Generate Compliance Checklist:** Based on the extracted products, their identified HS codes, and the origin/destination countries, generate a detailed checklist of all required export and import documents. **Crucially, use the detailed HS code and the organic status for each product to validate and identify any commodity-specific documentation requirements.** For example, certain HS codes may require a Phytosanitary Certificate, and products marked as 'organic' will require an Organic Certificate or equivalent import permit for ${toCountry}. Include general documents (like invoices and customs declarations) as well as these specific ones. For each item in the checklist, provide its name, a brief description, the issuing agency, a link to the agency's website if available, and categorize it as 'Customs', 'Regulatory', 'Food Safety', or 'Other'.

Your entire response must be a single JSON object that strictly adheres to the provided schema.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: extractionAndChecklistSchema
    }
  });

  // @ts-ignore
  const jsonText = typeof (response as any).text === 'function' ? (response as any).text() : response.text;

  try {
    const parsedJson = JSON.parse(jsonText);

    // Manual override for countries based on user selection, as requested in prompt.
    // Manual override removed - rely on AI extraction
    // parsedJson.extractedData.originCountry = fromCountry;
    // parsedJson.extractedData.destinationCountry = toCountry;

    return parsedJson;
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    console.error("Raw response text:", jsonText);
    throw new Error("Could not parse the AI's response.");
  }
};

export const generateDraftDocument = async (data: ExtractedPOData, documentType: DocumentType): Promise<string> => {
  const prompt = `You are an expert in international trade documentation. Based on the following JSON data, generate a draft '${documentType}' in HTML format.
    Use a professional and standard layout for this type of document.
    Include clear placeholders like "[Enter Full Shipper Address]", "[Enter Invoice #]", "[Enter Date]", "[Authorized Signature]" etc., for any information not provided in the JSON data.
    When listing products, if a product has the 'isOrganic' flag set to true, clearly state that the product is 'Organic' in its description (e.g., 'Organic Hass Avocados').
    The entire response must be a single, well-formed HTML string. Do not include markdown, backticks, or any other characters outside the HTML content.
    Crucially, add a prominent disclaimer at the top inside a styled box: "DRAFT DOCUMENT: This is an AI-generated draft. Please review all details carefully and consult with a compliance professional before use."

    JSON Data:
    ${JSON.stringify(data, null, 2)}
    `;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  // @ts-ignore
  const text = typeof (response as any).text === 'function' ? (response as any).text() : response.text;
  return text.replace(/```html|```/g, '').trim();
};

export const checkForRegulatoryUpdates = async (fromCountry: string, toCountry: string): Promise<string | null> => {
  const prompt = `As a trade compliance monitor, provide one recent, plausible, and concise regulatory update or alert for food products exported from ${fromCountry} to ${toCountry}.
    The update should be a single, impactful sentence. For example: '${toCountry} has introduced new labeling requirements for allergens on imported snacks.'
    If no specific recent update is widely known, invent a realistic-sounding one. Do not state that you are inventing it.
    If it's impossible to generate a plausible alert, respond with the exact text 'NO_UPDATES'.
    Your entire response must be just the single alert sentence or the text 'NO_UPDATES'.`;

  const response = await getAI().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  // @ts-ignore
  const alertText = (typeof (response as any).text === 'function' ? (response as any).text() : response.text).trim();

  if (alertText === 'NO_UPDATES' || alertText === '') {
    return null;
  }

  return alertText;
};