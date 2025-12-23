import { GoogleGenAI } from "@google/genai";
import { MODEL_THINKING } from "../constants";

// Initialize the client. API_KEY is assumed to be available in process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateThinkingResponse = async (
  prompt: string,
  imageData?: string // base64
) => {
  try {
    const contents: any = [];
    
    if (imageData) {
       contents.push({
         inlineData: {
           mimeType: 'image/jpeg', // Assuming jpeg for simplicity in analysis, but should match source
           data: imageData.split(',')[1] // remove data:image/xxx;base64,
         }
       });
    }
    
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: MODEL_THINKING,
      contents: {
        parts: contents
      },
      config: {
        thinkingConfig: {
            thinkingBudget: 32768 // Maximum thinking budget for deep reasoning
        }
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};