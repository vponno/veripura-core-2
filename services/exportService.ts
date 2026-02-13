import { db } from './lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface TrainingDataExport {
    id: string;
    text_input: string;
    output: string; // JSON string of the analysis
    pdf_url: string; // URL to the original PDF
    status: string;
    review_decision?: string;
}

export const exportService = {
    // Fetch Golden Label Data (Human Verified)
    getVerifiedTrainingData: async (): Promise<TrainingDataExport[]> => {
        const q = query(
            collection(db, 'training_dataset'),
            where('status', '==', 'human_verified'), // Only fetch what humans have checked
            orderBy('timestamp', 'desc'),
            limit(1000)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();

            // Construct the standardized "Text Input" (Prompt)
            // Ideally, this reproduces the prompt used by the AI
            const textInput = `Analyze the following trade document (${data.docType}):\n[DOCUMENT CONTENT PLACEHOLDER]`;

            // Construct the "Output" (The Golden Label Analysis)
            // We use the human-verified decision or the AI analysis if it was marked 'AGREED'
            const trainingOutput = JSON.stringify(data.analysis, null, 2);

            return {
                id: doc.id,
                text_input: textInput,
                output: trainingOutput,
                pdf_url: data.fileUrl || '',
                status: data.status,
                review_decision: data.humanReview?.label
            };
        });
    },

    // Convert to JSONL string
    generateJSONL: (data: TrainingDataExport[]): string => {
        return data.map(item => JSON.stringify({
            messages: [
                { role: "user", content: item.text_input },
                { role: "model", content: item.output }
            ],
            // Custom metadata for tracking source PDF
            metadata: {
                source_pdf: item.pdf_url,
                training_id: item.id
            }
        })).join('\n');
    },

    // Trigger Download
    downloadData: (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'application/jsonl' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Compatibility method for AdminReview.tsx
    exportTrainingDataToJSONL: async (): Promise<Blob> => {
        const data = await exportService.getVerifiedTrainingData();
        const jsonl = exportService.generateJSONL(data);
        return new Blob([jsonl], { type: 'application/jsonl' });
    }
};
