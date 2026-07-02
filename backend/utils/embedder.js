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

      prompt = `You are an expert document analysis and intelligence assistant. Your goal is to synthesize the provided document sources to construct a comprehensive, accurate, and highly detailed answer to the user's question.

CRITICAL INSTRUCTIONS:
1. Provide a detailed, well-structured answer using rich Markdown formatting (e.g. bold terms, bullet points, headers, or tables if appropriate) to make the explanation easy to read. Do not give incomplete or cut-off answers.
2. Every time you refer to facts or context from a source, you MUST cite it inline using the format [Source X] (e.g. [Source 1], [Source 2]).
3. Prioritize answering based on the provided document sources.
4. If the provided document sources do not contain enough details to fully answer, state what details are present in the sources, mention what is missing, and then you may supplement the response using your general knowledge to provide a complete, up-to-date answer (clearly indicating what is general knowledge vs. document content).
5. If the user's question is completely unrelated to the documents, answer it directly using your general knowledge, but prefix your answer with a note indicating it is outside the document context.

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
