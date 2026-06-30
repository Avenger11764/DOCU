import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazily initialize Gemini client for image OCR
let genAI = null;
const getGenAIClient = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Perform OCR on an image using Gemini 2.5 Flash's multimodal capability.
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 * @returns {Promise<string>}
 */
const performOCR = async (buffer, mimeType) => {
  try {
    const ai = getGenAIClient();
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const imagePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      }
    };

    const prompt = "Extract all text from this image as raw text. Do not add metadata, comments, or summaries. Just return the verbatim text found in the image. If there is no readable text, return an empty string.";
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text() || '';
  } catch (error) {
    console.error('Image OCR error:', error);
    throw new Error('Failed to extract text from the image using AI OCR.');
  }
};

/**
 * Parse text from multiple document types.
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 * @returns {Promise<string>}
 */
export const parseDocument = async (buffer, mimeType) => {
  if (mimeType === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text || '';
  }
  
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }
  
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  if (mimeType.startsWith('image/')) {
    return await performOCR(buffer, mimeType);
  }

  throw new Error(`Unsupported MIME type: ${mimeType}`);
};
