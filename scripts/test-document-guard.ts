
import { DocumentGuardSkill } from '../services/agent/skills/integrity/DocumentGuardSkill';
import { SkillContext } from '../services/agent/types';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load Environment Variables
dotenv.config();

// Polyfill for File/Blob in Node environment (if needed by LlamaParse SDK)
// Node 20+ has global File. If < 20, we might need to mock properly.
// The LlamaCloud SDK handles Buffer/Uint8Array gracefully.

// Hack to mock import.meta.env for the Skill which is client-side code
// We need to inject this into the global scope or mock the module resolution if we were using a bundler.
// Since we are running via ts-node, we can't easily patch import.meta.
// INSTAD, we will instantiate the class and if it fails on the prop access, we might need a workaround.
// HOWEVER, `import.meta` is syntax. 
// A better approach for this TEST script is to modify the Skill to accept API key in constructor or context,
// OR we use a tool like `vite-node` which supports `import.meta`.
// OR we just patch the class for the test.

// Let's rely on the fact that we might be running in a simplified environment.
// Actually, `ts-node` (ESM mode) might support `import.meta`.

async function main() {
    console.log('🛡️  Document Guard Verification 🛡️\n');

    const apiKey = process.env.VITE_LLAMA_CLOUD_API_KEY;
    if (!apiKey) {
        console.error('❌ Missing VITE_LLAMA_CLOUD_API_KEY in .env');
        process.exit(1);
    }

    // MOCK THE ENVIRONMENT for init
    // We can't easily mock import.meta.env in standard Node unless we use ESM.
    // Hack: We will create a subclass or mock the property if possible, 
    // BUT the property access happens inside `execute`. 
    // We can try to use a proxy or just run it and see. 
    // If it fails, we will manually patch the `DocumentGuardSkill.prototype.execute` or use a different approach.

    // Workaround: We'll modify the Skill to look at `process.env` as a fallback if `import.meta` is not defined?
    // No, that pollutes client code.
    // We can try to rely on `ts-node` being run with ESM support if possible.

    console.log('🔑  API Key found.');

    // Create a dummy PDF/Text file
    const dummyContent = "INVOICE #12345\nOrigin: Xinjiang, China\nProduct: Solar Panels\nQty: 100\n";
    const dummyBuffer = Buffer.from(dummyContent, 'utf-8');

    // Mock File object
    const file = new File([dummyBuffer], "invoice.txt", { type: "text/plain" });

    const context: SkillContext = {
        consignmentId: 'TEST-RECON-1',
        files: [file],
        metadata: {
            shipment: {
                origin: 'Xinjiang, China',
                product: 'Solar Panels'
            }
        }
    };

    const skill = new DocumentGuardSkill();

    // Inject API Key into the instance if we can, or rely on global env.
    // Checking if we can set a global variable that `import.meta.env` maps to? 
    // Only in build tools.

    // LET'S TRY running it. If it fails on import.meta, we'll see.
    // If we are strictly in CommonJS `ts-node`, `import.meta` is a syntax error.

    try {
        console.log('🚀 Executing DocumentGuardSkill...');
        const result = await skill.execute(context);

        console.log(`\nVerdict: ${result.verdict}`);
        console.log(`Confidence: ${result.confidence}`);
        if (result.data) {
            console.log(`Parsed Data: ${JSON.stringify(result.data, null, 2)}`);
        }

        if (result.success) {
            console.log('✅ TEST PASSED');
        } else {
            console.log('❌ TEST FAILED');
            console.error(result.errors);
        }

    } catch (error) {
        console.error('💥 Execution Error:', error);
    }
}

main();
