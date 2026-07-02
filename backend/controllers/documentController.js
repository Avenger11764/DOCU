import { Document, Chunk, Session, Message } from '../models/Document.js';
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

const chunkText = (text, size = 1200, overlap = 200) => {
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
    
    if (chunk.length <= overlap) {
      break;
    }
  }
  return chunks.filter(c => c.length > 10);
};

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await Session.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const customApiKey = req.headers['x-gemini-api-key'];
    const { originalname, size, mimetype, buffer } = req.file;
    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp'
    ];

    if (!allowedMimeTypes.includes(mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const text = await parseDocument(buffer, mimetype);
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No extractable text found in file' });
    }

    const document = new Document({
      sessionId,
      filename: originalname,
      fileSize: size,
      mimeType: mimetype,
    });
    await document.save();

    const textChunks = chunkText(text);
    const chunks = [];
    
    for (let index = 0; index < textChunks.length; index++) {
      const chunkText = textChunks[index];
      try {
        const embedding = await getEmbedding(chunkText, customApiKey);
        chunks.push(new Chunk({
          documentId: document._id,
          index,
          text: chunkText,
          embedding,
        }));
        if (index < textChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      } catch (embError) {
        if (embError.message.includes('429') || embError.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const embedding = await getEmbedding(chunkText, customApiKey);
          chunks.push(new Chunk({
            documentId: document._id,
            index,
            text: chunkText,
            embedding,
          }));
        } else {
          throw embError;
        }
      }
    }
    
    await Chunk.insertMany(chunks);

    res.status(201).json({
      message: 'Document saved successfully',
      document: {
        _id: document._id,
        filename: document.filename,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt,
        chunksCount: chunks.length
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: error.message || 'Error processing document' });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await Session.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const docs = await Document.find({ sessionId }).sort({ uploadedAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error('Fetch docs error:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const session = await Session.findOne({ _id: doc.sessionId, userId: req.user.id });
    if (!session) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Document.findByIdAndDelete(id);
    await Chunk.deleteMany({ documentId: id });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete doc error:', error);
    res.status(500).json({ error: 'Error deleting document' });
  }
};

export const createSession = async (req, res) => {
  try {
    const { title } = req.body;
    const sessionTitle = title || `Chat Session - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const session = new Session({
      userId: req.user.id,
      title: sessionTitle
    });
    await session.save();

    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Error creating chat session' });
  }
};

export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Fetch sessions error:', error);
    res.status(500).json({ error: 'Error fetching chat sessions' });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const documents = await Document.find({ sessionId });
    const docIds = documents.map(d => d._id);

    await Chunk.deleteMany({ documentId: { $in: docIds } });
    await Document.deleteMany({ sessionId });
    await Message.deleteMany({ sessionId });
    await Session.findByIdAndDelete(sessionId);

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Error deleting chat session' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Error fetching chat messages' });
  }
};

export const querySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { question } = req.body;

    if (!sessionId || !question) {
      return res.status(400).json({ error: 'sessionId and question are required' });
    }

    const session = await Session.findOne({ _id: sessionId, userId: req.user.id });
    if (!session) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const customApiKey = req.headers['x-gemini-api-key'];
    const userMsg = new Message({
      sessionId,
      role: 'user',
      text: question
    });
    await userMsg.save();

    const messageCount = await Message.countDocuments({ sessionId });
    if (messageCount === 1) {
      let sessionTitle = question.trim();
      if (sessionTitle.length > 35) {
        sessionTitle = sessionTitle.substring(0, 35) + '...';
      }
      session.title = sessionTitle;
      await session.save();
    }

    const documents = await Document.find({ sessionId });
    if (documents.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one document to start chatting in this session.' });
    }
    const docIds = documents.map(d => d._id);
    let topChunks = [];

    if (docIds.length > 0) {
      const queryEmbedding = await getEmbedding(question, customApiKey);
      const chunks = await Chunk.find({ documentId: { $in: docIds } });
      
      if (chunks.length > 0) {
        const scoredChunks = chunks.map(chunk => ({
          index: chunk.index,
          text: chunk.text,
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
        }));

        scoredChunks.sort((a, b) => b.similarity - a.similarity);
        topChunks = scoredChunks.slice(0, 10);
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ type: 'citations', citations: topChunks })}\n\n`);

    let fullResponseText = '';
    try {
      const stream = await generateGroundedAnswerStream(question, topChunks, customApiKey);
      for await (const chunk of stream) {
        const textVal = chunk.text();
        fullResponseText += textVal;
        res.write(`data: ${JSON.stringify({ type: 'token', token: textVal })}\n\n`);
      }

      const assistantMsg = new Message({
        sessionId,
        role: 'assistant',
        text: fullResponseText,
        citations: topChunks
      });
      await assistantMsg.save();

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (genError) {
      console.error('Generation stream error:', genError);
      res.write(`data: ${JSON.stringify({ type: 'error', error: genError.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Query Error:', error);
    res.status(500).json({ error: error.message || 'Error processing query session' });
  }
};

export const queryDocument = async (req, res) => {
  res.status(410).json({ error: 'legacy queryDocument endpoint has been deprecated, use querySession instead.' });
};
