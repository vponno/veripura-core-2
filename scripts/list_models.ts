
// Scripts/list_models.ts
import { GoogleGenAI } from "@google/genai";

// Use the API Key from the environment or hardcoded for testing as user previously saw it working in logs
// In a real script we might need to load .env, but here I'll try to rely on process.env or just ask the user if needed.
// However, the previous logs showed the key was present in the React app (Client side).
// Node process might not have it. I'll hardcode the key temporarily for this script to be sure,
// referencing the one I saw in firebase.ts earlier or just try to load environment.

// Actually, I'll assume the environment is set up or I'll paste the key if I had it.
// Since I can't easily see the full key from logs (it was length 39), I will try to read .env
import fs from 'fs';
import path from 'path';

function getApiKey() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
            if (match) return match[1].trim();
        }
    } catch (e) {
        console.error("Error reading .env", e);
    }
    return process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
}

const apiKey = getApiKey();

if (!apiKey) {
    console.error("No API Key found in .env or environment variables.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    console.log("Fetching available models...");
    try {
        const resp = await ai.models.list();
        console.log("Available Models:");

        // Try async iteration which is standard for Google Node SDK pagers
        for await (const model of resp) {
            console.log(model.name);
        }
    } catch (e) {
        console.error("Failed to list models:", e);
    }
}

listModels();
