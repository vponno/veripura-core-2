import { AnalysisEngine, GeminiV3Engine, StandardOCREngine } from "./DocumentAnalysisEngines";
import { logger } from './lib/logger';

// --- Service Implementation ---

class ValidationService {
    private engine: AnalysisEngine;

    constructor() {
        // Default to Gemini V3 "Oracle"
        this.engine = new GeminiV3Engine();

        // Example: Logic to swap engines based on config or flags could go here
        // if (process.env.USE_STANDARD_OCR === 'true') {
        //     this.engine = new StandardOCREngine();
        // }
    }

    /**
     * Switch the active analysis engine at runtime.
     * @param engineName 'gemini' | 'standard'
     */
    public setEngine(engineName: 'gemini' | 'standard') {
        if (engineName === 'standard') {
            this.engine = new StandardOCREngine();
        } else {
            this.engine = new GeminiV3Engine();
        }
        logger.log(`[ValidationService] Switched to engine: ${this.engine.name}`);
    }

    public getActiveEngineName(): string {
        return this.engine.name;
    }

    public async analyzeDocument(file: File, context?: { exportFrom: string, importTo: string }): Promise<any> {
        logger.log(`[ValidationService] Analyzing with ${this.engine.name}...`);
        return this.engine.analyzeDocument(file, context);
    }

    public async extractTradeDna(file: File): Promise<any> {
        logger.log(`[ValidationService] Extracting DNA with ${this.engine.name}...`);
        return this.engine.extractTradeDna(file);
    }
}

// Export a singleton instance
export const validationService = new ValidationService();

