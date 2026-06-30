import express from 'express';
import multer from 'multer';
import { uploadDocument, getDocuments, deleteDocument, queryDocument } from '../controllers/documentController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.delete('/:id', deleteDocument);
router.post('/query', queryDocument);

export default router;
