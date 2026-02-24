"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDocument = exports.getComplianceRules = void 0;
const functions = require("firebase-functions");
const bigquery_1 = require("@google-cloud/bigquery");
const llama_cloud_1 = require("@llamaindex/llama-cloud");
const uploads_js_1 = require("@llamaindex/llama-cloud/core/uploads.js");
const bigquery = new bigquery_1.BigQuery();
exports.getComplianceRules = functions.https.onCall(async (data, context) => {
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
        let attrRows = [];
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
                ruleId: r.regulation_name,
                regulation: r.regulation_name,
                description: r.description,
                required_document: r.required_document,
                source: r.source
            }))
        };
    }
    catch (error) {
        console.error("Phase 3 Oracle Error:", error);
        throw new functions.https.HttpsError("internal", "Compliance Engine Failed");
    }
});
exports.parseDocument = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    const { base64, fileName } = data;
    if (!base64) {
        throw new functions.https.HttpsError("invalid-argument", "Missing base64 data");
    }
    const apiKey = process.env.VITE_LLAMA_CLOUD_API_KEY || ((_a = functions.config().llamacloud) === null || _a === void 0 ? void 0 : _a.api_key);
    if (!apiKey) {
        console.error("[parseDocument] Missing LlamaCloud API Key");
        throw new functions.https.HttpsError("failed-precondition", "Missing LlamaCloud API Key in backend");
    }
    try {
        const client = new llama_cloud_1.LlamaCloud({ apiKey });
        // Convert base64 to Buffer then to File format for SDK
        const buffer = Buffer.from(base64, 'base64');
        const uploadFile = await (0, uploads_js_1.toFile)(buffer, fileName || 'document.pdf');
        console.log(`[parseDocument] Parsing file: ${fileName}`);
        const jobResult = await client.parsing.parse({
            upload_file: uploadFile,
            tier: 'cost_effective',
            version: 'latest',
            expand: ['markdown']
        });
        const parsedText = (jobResult === null || jobResult === void 0 ? void 0 : jobResult.markdown_full)
            || ((_c = (_b = jobResult === null || jobResult === void 0 ? void 0 : jobResult.markdown) === null || _b === void 0 ? void 0 : _b.pages) === null || _c === void 0 ? void 0 : _c.map((p) => p.markdown || "").join("\n"))
            || "";
        return {
            status: "success",
            markdown: parsedText
        };
    }
    catch (error) {
        console.error("LlamaParse Backend Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to parse document");
    }
});
//# sourceMappingURL=index.js.map