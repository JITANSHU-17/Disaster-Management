/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateQuizForModule(moduleTitle: string, moduleContent: string): Promise<QuizQuestion[]> {
  const prompt = `
    Generate a 3-question multiple choice quiz for the following disaster preparedness module:
    Title: ${moduleTitle}
    Content: ${moduleContent}

    The quiz should test key safety knowledge. Each question must have 4 options and exactly one correct answer.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswer: { type: Type.INTEGER, description: "Index of the correct answer (0-3)" }
            },
            required: ["id", "text", "options", "correctAnswer"]
          }
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
  } catch (error) {
    console.error("Error generating quiz:", error);
  }

  // Fallback quiz if AI fails or key is missing
  return [
    {
      id: "q1",
      text: `What is the most important first step during a ${moduleTitle.toLowerCase()}?`,
      options: ["Stay calm and follow protocol", "Run outside immediately", "Hide in a closet", "Call friends"],
      correctAnswer: 0
    }
  ];
}
