import { ExtractedPOData, ChecklistItem } from '../../../types';

export interface AnalysisOptions {
    fromCountry: string;
    toCountry: string;
}

export interface AnalysisResult {
    extractedData: ExtractedPOData;
    checklist: ChecklistItem[];
}

export interface DocumentAnalysisProvider {
    name: string;
    analyze(fileBase64: string, mimeType: string, options: AnalysisOptions): Promise<AnalysisResult>;
}
