import { generateText, type ToolSet } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const GEMINI_MODEL = 'gemini-2.5-flash';
// Groq: modelo com suporte a tool-calling, usado como fallback quando o
// Gemini estoura quota/rate-limit (free tier: 5 req/min, 20/dia).
const GROQ_FALLBACK_MODEL = 'llama-3.3-70b-versatile';

interface GenerateWithFallbackOptions {
  system: string;
  prompt: string;
  maxOutputTokens?: number;
  temperature?: number;
  tools?: ToolSet;
}

/**
 * Chama o Gemini primeiro; se falhar (quota, rate-limit, indisponibilidade),
 * tenta de novo com Groq usando os mesmos parâmetros, antes de propagar o
 * erro pro fallback heurístico de cada agente.
 */
export async function generateTextWithFallback({ system, prompt, maxOutputTokens, temperature, tools }: GenerateWithFallbackOptions) {
  try {
    return await generateText({
      model: google(GEMINI_MODEL),
      system,
      prompt,
      maxOutputTokens,
      temperature,
      tools,
    });
  } catch (geminiError: any) {
    console.error('[AI Fallback] Gemini falhou, tentando Groq:', geminiError.message);
    try {
      const result = await generateText({
        model: groq(GROQ_FALLBACK_MODEL),
        system,
        prompt,
        maxOutputTokens,
        temperature,
        tools,
      });
      console.log('[AI Fallback] Groq respondeu com sucesso.');
      return result;
    } catch (groqError: any) {
      console.error('[AI Fallback] Groq também falhou:', groqError.message);
      throw groqError;
    }
  }
}
