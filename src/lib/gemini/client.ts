import { GoogleGenAI } from '@google/genai';

export function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }
  return new GoogleGenAI({ apiKey });
}

