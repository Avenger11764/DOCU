import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
const getGenAIClient = (customApiKey) => {
  if (customApiKey) {
    return new GoogleGenerativeAI(customApiKey);
  }
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};


export const getEmbedding = async (text, customApiKey) => {
  try {
    const ai = getGenAIClient(customApiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    if (result && result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
    throw new Error('No embedding returned from Gemini API.');
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};


export const generateGroundedAnswerStream = async (query, contextChunks = [], customApiKey) => {
  try {
    const ai = getGenAIClient(customApiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt = '';
    if (contextChunks && contextChunks.length > 0) {
      const contextText = contextChunks
        .map((chunk, index) => `[Source ${index + 1}]:\n${chunk.text}`)
        .join('\n\n');

      prompt = `You are a strict document Q&A assistant. Your ONLY task is to answer the user's question based on the provided document sources below.

CRITICAL INSTRUCTIONS:
1. You must answer the user's question based ONLY on the provided document sources.
2. If the user's question is unrelated to the provided document sources, or if the context does not contain the answer, you must respond with EXACTLY: "I am only allowed to answer questions that are directly related to the uploaded document context."
3. Absolutely DO NOT answer any general knowledge questions, conversational chitchat, mathematical queries, or coding questions that cannot be directly verified by the document sources. Refuse all queries outside the document context using the exact message above.
4. Do not make up facts, do not use outside knowledge, and do not speculate.
5. When referencing information from a source, you MUST cite it in the text using format like [Source 1], [Source 2], etc.

Document Sources:
${contextText}

User Question: ${query}

Strict Grounded Answer:`;
    } else {
      prompt = `You are a helpful, premium AI research assistant. 
Answer the user's question. If they ask about documents or files, explain that they can upload them using the drag-and-drop area in the sidebar to chat with them.

User Question: ${query}

Answer:`;
    }

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return result.stream;
  } catch (error) {
    console.error('Error generating answer stream:', error);
    throw error;
  }
};
