
import { GoogleGenAI, Type } from "@google/genai";
import { Lesson } from "../types";

// Always use named parameter for apiKey
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getInterestSuggestions = async (currentInterests: string[]): Promise<string[]> => {
  const prompt = `Based on these interests: ${currentInterests.join(", ")}, suggest 5 related areas of study, books, or niche topics. 
  Focus on high-growth fields, psychological frameworks, or influential books.
  Return only a JSON array of strings.`;

  // Use gemini-3-flash-preview as recommended for basic tasks
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  // response.text is a property, not a method
  return JSON.parse(response.text || '[]');
};

export const generateLesson = async (
  targetCategory: string, 
  allInterests: string[], 
  previousLesson?: Lesson
): Promise<Lesson> => {
  const prompt = `Generate a daily micro-lesson for the category: "${targetCategory}".
  
  CORE MISSION: 
  The "content" and "practicalApplication" MUST focus 100% on "${targetCategory}". Do NOT mention or blend in other interests like ${allInterests.filter(i => i !== targetCategory).join(", ")} inside the main content.
  
  INTERDISCIPLINARY CONNECTION (Separate Section):
  Only in the "connectionToPrevious" field, briefly explain how this topic might tangentially relate to the previous lesson: "${previousLesson?.title || 'None'}". 
  
  REQUIREMENTS:
  - Title: Catchy and academic.
  - Content: Deep-dive into a specific concept of ${targetCategory}.
  - Practical Application: How to use this specific ${targetCategory} concept in real life.
  - Connection: A separate bridge to the previous theme.`;

  // Use gemini-3-pro-preview for more complex tasks (educational generation)
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          content: { type: Type.STRING },
          practicalApplication: { type: Type.STRING },
          connectionToPrevious: { type: Type.STRING },
          sourceMaterial: { type: Type.STRING }
        },
        required: ["title", "category", "content", "practicalApplication", "connectionToPrevious"]
      }
    }
  });

  // response.text is a property, not a method
  const data = JSON.parse(response.text || '{}');
  return {
    ...data,
    categoryRef: targetCategory,
    id: Math.random().toString(36).substring(7),
    date: new Date().toLocaleDateString()
  };
};
