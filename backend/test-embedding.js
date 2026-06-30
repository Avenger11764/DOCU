import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    console.log("Testing gemini-embedding-001...");
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent("Hello world");
    console.log("Success with gemini-embedding-001!", result.embedding.values.slice(0, 5));
  } catch (err) {
    console.error("Failed gemini-embedding-001:", err.message);
  }
}

test();
