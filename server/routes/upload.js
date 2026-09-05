const express = require('express');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const { createEmbedding } = require('../services/embeddingService');
const { extractTextFromPdf } = require('../services/pdfService');
const { findDocumentByHash, upsertDocumentChunks } = require('../services/qdrantService');
const { createChunks } = require('../utils/chunking');

const router = express.Router();
const upload = multer({ dest: 'Uploads/' });

async function deleteUploadedFile(filePath) {
    if (!filePath) {
        return;
    }

    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Error deleting uploaded file:', error);
        }
    }
}

router.post('/', upload.single('pdf'), async (req, res) => {
    console.log(req.file);
    console.log(req.body);
    try {
        if (!req.file) {
            return res.status(400).send('Missing PDF file');
        }

        const dataBuffer = fs.readFileSync(req.file.path);
        const documentHash = crypto
            .createHash('sha256')
            .update(dataBuffer)
            .digest('hex');

        const existingDocument = await findDocumentByHash(documentHash);
        if (existingDocument) {
            return res.json({
                message: 'PDF already uploaded',
                documentId: existingDocument.documentId
            });
        }

        const documentId = crypto.randomUUID();
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

        await upsertDocumentChunks(documentId, documentHash, chunkEmbeddings);

        res.json({
            message: 'PDF uploaded successfully',
            documentId: documentId
        });
    }
    catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).send('Error uploading PDF');
    }
    finally {
        await deleteUploadedFile(req.file?.path);
    }
});

module.exports = router;
