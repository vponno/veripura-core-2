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
    
    return JSON.parse(text) as AIAnalysisResult;

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