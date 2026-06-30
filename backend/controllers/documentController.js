import { Document, Chunk } from '../models/Document.js';
import { parseDocument } from '../utils/documentParser.js';
import { getEmbedding, generateGroundedAnswerStream } from '../utils/embedder.js';

const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const chunkText = (text, size = 800, overlap = 150) => {
  const chunks = [];
  if (!text) return chunks;

  const cleanedText = text.replace(/\s+/g, ' ').trim();
  let start = 0;

  while (start < cleanedText.length) {
    const end = Math.min(start + size, cleanedText.length);
    let chunk = cleanedText.slice(start, end);

    if (end < cleanedText.length) {
      const lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > size * 0.8) {
        chunk = chunk.slice(0, lastSpace);
      }
    }

    chunks.push(chunk.trim());
    start += chunk.length - overlap;

    if (chunk.length <= overlap) break;
  }
  return chunks.filter(c => c.length > 10);
};

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp'
    ];

    const { originalname, size, mimetype, buffer } = req.file;

    if (!allowedMimeTypes.includes(mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const text = await parseDocument(buffer, mimetype);
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No extractable text found in file' });
    }

    const document = new Document({ filename: originalname, fileSize: size, mimeType: mimetype });
    await document.save();

    const textChunks = chunkText(text);
    const chunks = [];

    for (let index = 0; index < textChunks.length; index++) {
      const chunkContent = textChunks[index];
      try {
        const embedding = await getEmbedding(chunkContent);
        chunks.push(new Chunk({ documentId: document._id, index, text: chunkContent, embedding }));
        if (index < textChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      } catch (embError) {
        if (embError.message?.includes('429') || embError.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const embedding = await getEmbedding(chunkContent);
          chunks.push(new Chunk({ documentId: document._id, index, text: chunkContent, embedding }));
        } else {
          throw embError;
        }
      }
    }

    await Chunk.insertMany(chunks);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        _id: document._id,
        filename: document.filename,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt,
        chunksCount: chunks.length,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Error processing document' });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const docs = await Document.find().sort({ uploadedAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    await Chunk.deleteMany({ documentId: id });
    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Error deleting document' });
  }
};

export const queryDocument = async (req, res) => {
  try {
    const { question, documentId } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    let topChunks = [];

    if (documentId) {
      const queryEmbedding = await getEmbedding(question);
      const chunks = await Chunk.find({ documentId });

      if (chunks.length > 0) {
        const scoredChunks = chunks.map(chunk => ({
          index: chunk.index,
          text: chunk.text,
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
        }));
        scoredChunks.sort((a, b) => b.similarity - a.similarity);
        topChunks = scoredChunks.slice(0, 4);
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ type: 'citations', citations: topChunks })}\n\n`);

    let fullResponseText = '';
    try {
      const stream = await generateGroundedAnswerStream(question, topChunks);
      for await (const chunk of stream) {
        const textVal = chunk.text();
        fullResponseText += textVal;
        res.write(`data: ${JSON.stringify({ type: 'token', token: textVal })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (genError) {
      console.error('Generation error:', genError);
      res.write(`data: ${JSON.stringify({ type: 'error', error: genError.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message || 'Error processing query' });
  }
};
