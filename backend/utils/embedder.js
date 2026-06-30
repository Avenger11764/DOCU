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

/**
 * Generate embedding vector for a given text.
 * @param {string} text 
 * @param {string} [customApiKey]
 * @returns {Promise<number[]>}
 */
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

/**
 * Stream an answer grounded in document context (or fall back to general LLM response).
 * @param {string} query - The user's question
 * @param {Array<{text: string}>} contextChunks - The most relevant chunks
 * @param {string} [customApiKey]
 * @returns {Promise<any>} The stream object
 */
export const generateGroundedAnswerStream = async (query, contextChunks = [], customApiKey) => {
  try {
    const ai = getGenAIClient(customApiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt = '';
    if (contextChunks && contextChunks.length > 0) {
      const contextText = contextChunks
        .map((chunk, index) => `[Source ${index + 1}]:\n${chunk.text}`)
        .join('\n\n');

      prompt = `You are a helpful assistant answering questions about uploaded documents.
You must answer the user's question based ONLY on the provided document sources below.
If the context does not contain relevant information to answer the question, reply with: "I'm sorry, but I couldn't find any relevant information in the uploaded documents to answer your question."
Do not make up facts or use outside knowledge not mentioned in the context.

When referencing information from a source, you MUST cite it in the text using format like [Source 1], [Source 2], etc.

Document Sources:
${contextText}

User Question: ${query}

Grounded Answer:`;
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
