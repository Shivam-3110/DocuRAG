const express = require('express');
const multer = require('multer');
const { randomUUID } = require('crypto');
const { createEmbedding } = require('../services/embeddingService');
const { extractTextFromPdf } = require('../services/pdfService');
const { upsertDocumentChunks } = require('../services/qdrantService');
const { createChunks } = require('../utils/chunking');

const router = express.Router();
const upload = multer({ dest: 'Uploads/' });

router.post('/', upload.single('pdf'), async (req, res) => {
    console.log(req.file);
    console.log(req.body);
    try {
        if (!req.file) {
            return res.status(400).send('Missing PDF file');
        }

        const documentId = randomUUID();
        const text = await extractTextFromPdf(req.file.path);
        const chunks = createChunks(text);
        console.log(chunks);
        const chunkEmbeddings = [];
        for (const chunk of chunks) {
            const embedding = await createEmbedding(chunk);
            chunkEmbeddings.push({
                text: chunk,
                embedding: embedding
            });
        }

        await upsertDocumentChunks(documentId, chunkEmbeddings);

        res.json({
            documentId: documentId,
            message: 'PDF uploaded successfully'
        });
    }
    catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).send('Error uploading PDF');
    }
});

module.exports = router;
