const express = require('express');
const { createEmbedding } = require('../services/embeddingService');
const { searchDocumentChunks } = require('../services/qdrantService');
const { generateAnswer } = require('../services/ragService');

const router = express.Router();

function isValidDocumentId(documentId) {
    return typeof documentId === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId);
}

router.post('/', async (req, res) => {
    console.log(req.body);
    try {
        const documentId = req.body.documentId;
        const question = req.body.question;

        if (!isValidDocumentId(documentId)) {
            return res.status(400).send('Missing or invalid documentId');
        }

        if (!question || typeof question !== 'string') {
            return res.status(400).send('Missing question');
        }

        const questionEmbedding = await createEmbedding(question);
        const searchResult = await searchDocumentChunks(documentId, questionEmbedding);
        console.log(searchResult);
        if (!searchResult.points || searchResult.points.length === 0) {
            return res.status(404).send('No chunks found for documentId');
        }

        const context = searchResult.points
            .map(point => point.payload.text)
            .join('\n\n');
        console.log(context);

        const answer = await generateAnswer(context, question);
        res.set('X-Document-Id', documentId);
        res.send(answer);
    }
    catch (error) {
        console.error('Error asking question:', error);
        res.status(500).send('Error asking question');
    }
});

module.exports = router;
