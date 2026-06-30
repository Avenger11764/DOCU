import pdf from 'pdf-parse/lib/pdf-parse.js';

/**
 * Extract text from PDF buffer.
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
export const parsePDF = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text || '';
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF document.');
  }
};
