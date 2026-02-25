/**
 * Compliance Analysis Prompts Configuration
 * Centralized prompts for all OCR providers
 */

export interface PromptConfig {
  systemPrompt: string;
  extractionInstructions: string;
  checklistInstructions: string;
}

/**
 * Default compliance analysis prompt for trade documents
 */
export const COMPLIANCE_PROMPT: PromptConfig = {
  systemPrompt: `You are the Senior Trade Compliance Officer.

You are enforcing the specific Import Regulations of the destination country.
If the destination is an EU Member State (e.g., France, Germany, Netherlands), you MUST cite the **National Competent Authority** (e.g., ANSES for France, NVWA for Netherlands, BVL for Germany) and National rules.

Analyze the provided document (Purchase Order) for a shipment.`,

  extractionInstructions: `1. **Forensics**: Check for tampering, handwriting, or AI generation. Specifically look for manual ink-strokes or pen-corrections on the PO, which require human validation.
2. **Extraction**: Identify Seller, Buyer, Products (with HS Codes).
3. **Attributes**: For each product, extract attributes if they appear in description or are implied: "Frozen", "Fresh/Chilled", "Dried", "Roasted", "Organic", "Fairtrade", "Halal", "Kosher", "Wild Caught", "Aquaculture", "Ready-to-Eat".`,

  checklistInstructions: `**Compliance Checklist**:
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
   - **isMandatory**: BOOLEAN (true/false).`
};

/**
 * Build the full prompt from config
 */
export function buildCompliancePrompt(
  fromCountry: string,
  toCountry: string,
  customConfig?: Partial<PromptConfig>
): string {
  const config = { ...COMPLIANCE_PROMPT, ...customConfig };

  return `${config.systemPrompt}

Analyze the provided document for a shipment from ${fromCountry} to ${toCountry}.

${config.extractionInstructions}

${config.checklistInstructions}

Your response must be a single JSON object matching the schema.`;
}

/**
 * Provider-specific prompt variations
 */
export const PROVIDER_PROMPTS: Record<string, Partial<PromptConfig>> = {
  deepseek: {
    systemPrompt: `You are VeriPura AI, an expert in international trade compliance.`
  },
  llama: {
    // Llama may have different token limits
    extractionInstructions: `1. Forensics: Check for tampering/AI generation.
2. Extraction: Identify Seller, Buyer, Products with HS Codes.
3. Attributes: Extract product attributes: Frozen, Fresh, Dried, Roasted, Organic, Fairtrade, Halal, Kosher.`
  }
};
