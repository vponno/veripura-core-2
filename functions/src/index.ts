import * as functions from "firebase-functions";
import { BigQuery } from "@google-cloud/bigquery";
import { LlamaCloud } from "@llamaindex/llama-cloud";
import { toFile } from "@llamaindex/llama-cloud/core/uploads.js";

const bigquery = new BigQuery();

interface ComplianceRequest {
    origin: string;
    destination: string;
    product: string; // Description like "Frozen Shrimp"
    hsCode?: string; // e.g., "030617"
    attributes?: string[]; // e.g., ["Organic", "Frozen"]
}

export const getComplianceRules = functions.https.onCall(async (data: ComplianceRequest, context) => {
    // 1. Inputs
    const { origin, destination, product, hsCode, attributes = [] } = data;
    console.log(`Phase 3 Analysis: ${origin}->${destination} [${product}] [${hsCode}] Attrs:[${attributes.join(',')}]`);

    // 2. Parallel Queries (The 4-Filter Logic)
    // We construct distinct queries for each layer to ensure modularity.

    // Layer 1: HS Code Rules (Prefix Matching)
    // Matches first 4 digits (e.g. 0306)
    const hsPrefix = hsCode ? hsCode.substring(0, 4) : '0000';
    const queryHS = `
        SELECT regulation_name, required_document, description, 'HS_CODE' as source
        FROM \`veripura-connect-live.compliance_engine.hs_rules\`
        WHERE hs_prefix = @hsPrefix
    `;

    // Layer 2: Country Rules (Origin -> Destination)
    const queryCountry = `
        SELECT regulation_name, required_document, description, 'TRADE_LANE' as source
        FROM \`veripura-connect-live.compliance_engine.country_rules\`
        WHERE origin_country = @origin AND destination_country = @destination
    `;

    // Layer 3: Attribute Rules (Dynamic List)
    // We use UNNEST to match any keyword in the input array
    const queryAttr = `
        SELECT regulation_name, required_document, description, 'ATTRIBUTE' as source
        FROM \`veripura-connect-live.compliance_engine.attribute_rules\`
        WHERE keyword IN UNNEST(@attributes)
    `;

    try {
        const [hsRows] = await bigquery.query({ query: queryHS, params: { hsPrefix } });
        const [countryRows] = await bigquery.query({ query: queryCountry, params: { origin, destination } });

        // Only run attribute query if attributes exist, otherwise empty
        let attrRows: any[] = [];
        if (attributes.length > 0) {
            const [rows] = await bigquery.query({ query: queryAttr, params: { attributes } });
            attrRows = rows;
        }

        // 3. Aggregate Results
        const allRules = [...hsRows, ...countryRows, ...attrRows];

        // 4. "Oracle Memory" - Log the Query for AI Training
        // We log asynchronously (don't await) to keep UI fast, or await if strict.
        const logQuery = `
            INSERT INTO \`veripura-connect-live.compliance_engine.compliance_query_logs\`
            (query_timestamp, origin, destination, hs_code, attributes, resolved_requirements)
            VALUES (CURRENT_TIMESTAMP(), @origin, @destination, @hsCode, @attributes, @requirements)
        `;

        const reqNames = allRules.map(r => r.required_document);
        await bigquery.query({
            query: logQuery,
            params: {
                origin,
                destination,
                hsCode: hsCode || 'UNKNOWN',
                attributes,
                requirements: reqNames
            }
        });

        // 5. Return to Frontend
        return {
            status: "success",
            rules: allRules.map(r => ({
                ruleId: r.regulation_name, // Using reg name as ID for now
                regulation: r.regulation_name,
                description: r.description,
                required_document: r.required_document,
                source: r.source
            }))
        };

    } catch (error) {
        console.error("Phase 3 Oracle Error:", error);
        throw new functions.https.HttpsError("internal", "Compliance Engine Failed");
    }
});

interface ParseRequest {
    base64: string;
    fileName: string;
}

export const parseDocument = functions.https.onCall(async (data: ParseRequest, context) => {
    const { base64, fileName } = data;

    if (!base64) {
        throw new functions.https.HttpsError("invalid-argument", "Missing base64 data");
    }

    const apiKey = process.env.VITE_LLAMA_CLOUD_API_KEY || functions.config().llamacloud?.api_key;

    if (!apiKey) {
        console.error("[parseDocument] Missing LlamaCloud API Key");
        throw new functions.https.HttpsError("failed-precondition", "Missing LlamaCloud API Key in backend");
    }

    try {
        const client = new LlamaCloud({ apiKey });

        // Convert base64 to Buffer then to File format for SDK
        const buffer = Buffer.from(base64, 'base64');
        const uploadFile = await toFile(buffer, fileName || 'document.pdf');

        console.log(`[parseDocument] Parsing file: ${fileName}`);
        const jobResult = await client.parsing.parse({
            upload_file: uploadFile,
            tier: 'cost_effective',
            version: 'latest',
            expand: ['markdown']
        });

        const parsedText = (jobResult as any)?.markdown_full
            || (jobResult as any)?.markdown?.pages?.map((p: any) => p.markdown || "").join("\n")
            || "";

        return {
            status: "success",
            markdown: parsedText
        };

    } catch (error: any) {
        console.error("LlamaParse Backend Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to parse document");
    }
});
