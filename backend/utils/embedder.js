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

      prompt = `You are an expert document analysis and intelligence assistant. Your goal is to answer the user's question accurately, directly, and strictly based on the provided document sources.

CRITICAL INSTRUCTIONS:
1. Answer ONLY what is directly asked in the user's question. Avoid adding extra, unasked details, background fluff, or tangential general knowledge.
2. Every time you refer to facts or context from a source, you MUST cite it inline using the format [Source X] (e.g. [Source 1], [Source 2]).
3. Base your answers strictly on the facts present in the provided document sources.
4. If the document sources do not contain the answer to the question, state clearly that the information is not present in the uploaded document. Do not attempt to guess or supplement with outside general knowledge unless the user explicitly requests outside information.
5. Keep the formatting clean, professional, and readable using basic markdown. Avoid unnecessary walls of text.

Document Sources:
${contextText}

User Question: ${query}

Optimized Grounded Answer:`;
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
