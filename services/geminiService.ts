import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

// In a real scenario, this key comes from process.env.API_KEY
// The user will likely have to provide it if the env is not set up in the demo environment.
// For the purpose of this output, we assume the environment is correctly configured or the user will handle the key.
const apiKey = process.env.API_KEY || 'fake-key-for-structure-only';

const ai = new GoogleGenAI({ apiKey });

export const analyzeMarketDemand = async (productType: string, historicalData: any[]): Promise<AIAnalysisResult> => {
  if (!process.env.API_KEY) {
    // Fallback mock if no API Key provided in environment
    console.warn("No API_KEY found. Returning mock analysis.");
    return {
      prediction: "High demand expected due to seasonal shortages in competing regions.",
      confidence: 0.85,
      recommendations: [
        "Increase price by 5-10%",
        "Prioritize organic certification labels"
      ],
      marketTrend: "UP"
    };
  }

  try {
    const prompt = `
      Analyze the market demand for ${productType}.
      Historical Context: ${JSON.stringify(historicalData)}
      
      Provide a JSON response with the following fields:
      - prediction: A brief textual prediction.
      - confidence: A number between 0 and 1.
      - recommendations: An array of strings (tactical advice for the farmer).
      - marketTrend: One of "UP", "DOWN", "STABLE".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            marketTrend: { type: Type.STRING, enum: ["UP", "DOWN", "STABLE"] }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    try {
      return JSON.parse(text) as AIAnalysisResult;
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      return {
        prediction: "Unable to analyze at this moment.",
        confidence: 0,
        recommendations: ["Check connection", "Try again later"],
        marketTrend: "STABLE"
      };
    }

  } catch (error) {
    console.error("AI Analysis failed", error);
    // Fallback on error
    return {
      prediction: "Unable to analyze at this moment.",
      confidence: 0,
      recommendations: ["Check connection", "Try again later"],
      marketTrend: "STABLE"
    };
  }
};

export interface GuardianIntent {
  action: 'ADD_REQUIREMENT' | 'REMOVE_REQUIREMENT' | 'QUERY' | 'UNKNOWN';
  docName?: string;
  category?: string;
  reasoning?: string;
  confidence: number;
}

export const analyzeGuardianIntent = async (userText: string): Promise<GuardianIntent> => {
  // Mock response if no key (for development/demo stability)
  if (!process.env.API_KEY && !apiKey.startsWith('AIza')) {
    // Simple fallback heuristics for demo mode if key is missing
    const lowerText = userText.toLowerCase();
    if (lowerText.includes('remove') || lowerText.includes('delete')) {
      // Simple extraction for mock
      const docName = userText.replace(/remove|delete/i, '').trim();
      return { action: 'REMOVE_REQUIREMENT', docName: docName || 'Document', confidence: 0.9 };
    }
    if (lowerText.includes('organic')) return { action: 'ADD_REQUIREMENT', docName: 'Organic Certificate', category: 'Certifications', confidence: 0.9 };
    if (lowerText.includes('halal')) return { action: 'ADD_REQUIREMENT', docName: 'Halal Certificate', category: 'Certifications', confidence: 0.9 };
    if (lowerText.includes('phyto')) return { action: 'ADD_REQUIREMENT', docName: 'Phytosanitary Certificate', category: 'Regulatory', confidence: 0.9 };
    return { action: 'UNKNOWN', confidence: 0.5 };
  }

  try {
    const prompt = `
        You are the "Guardian Orchestrator" for a trade compliance system.
        Analyze the user's request: "${userText}".
        
        Determine the user's intent:
        1. ADD_REQUIREMENT: User wants to add a document (e.g., "I need a Phyto cert").
        2. REMOVE_REQUIREMENT: User wants to remove/delete a document (e.g., "Remove the Halal cert", "I don't need Organic anymore").
        3. QUERY: User is asking a question.
        
        Return JSON with:
        - action: "ADD_REQUIREMENT" | "REMOVE_REQUIREMENT" | "QUERY" | "UNKNOWN"
        - docName: The specific document name (canonicalize it, e.g., "Phyto" -> "Phytosanitary Certificate").
        - category: One of "Regulatory", "Food Safety", "Certifications", "Logistics", "Financial", "Social Compliance".
        - reasoning: Brief explanation of why you chose this.
        - confidence: 0.0 to 1.0
        `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Or 1.5-flash
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // specific schema helps strict output
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ["ADD_REQUIREMENT", "REMOVE_REQUIREMENT", "QUERY", "UNKNOWN"] },
            docName: { type: Type.STRING },
            category: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response");
    
    try {
      return JSON.parse(text) as GuardianIntent;
    } catch (parseError) {
      console.error("Failed to parse Guardian Intent response:", parseError);
      return { action: 'UNKNOWN', confidence: 0 };
    }

  } catch (error) {
    console.error("Guardian Intent Analysis failed", error);
    return { action: 'UNKNOWN', confidence: 0 };
  }
};