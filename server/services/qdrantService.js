const { randomUUID } = require('crypto');
const {QdrantClient} = require('@qdrant/js-client-rest');

const COLLECTION_NAME = 'pdf-docs';

const qdrant = new QdrantClient({
    url: process.env.QUADRANT_URL,
    apiKey: process.env.QUADRANT_API_KEY
});

let documentIdIndexReady = false;

async function ensureDocumentIdPayloadIndex() {
    if (documentIdIndexReady) {
        return;
    }

    try {
        await qdrant.createPayloadIndex(COLLECTION_NAME, {
            field_name: 'documentId',
            field_schema: 'uuid',
            wait: true
        });
        documentIdIndexReady = true;
    } catch (error) {
        const message = error?.data?.status?.error || error.message || '';
        if (message.toLowerCase().includes('already exists')) {
            documentIdIndexReady = true;
            return;
        }

        throw error;
    }
}

async function createCollectionIfNeeded() {
    const collectionExistsResult = await qdrant.collectionExists(COLLECTION_NAME);
    const collectionExists = typeof collectionExistsResult === 'boolean' ?
        collectionExistsResult :
        collectionExistsResult.exists;

    if (!collectionExists) {
        await qdrant.createCollection(COLLECTION_NAME,{
            vectors: {
                size:3072,
                distance: 'Cosine'
            }
        });
    }

    await ensureDocumentIdPayloadIndex();
}

async function upsertDocumentChunks(documentId, chunkEmbeddings) {
    const points = chunkEmbeddings.map((item) => ({
        id: randomUUID(),
        vector: item.embedding,
        payload: {
            text: item.text,
            documentId: documentId
        }
    }));

    await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points: points
    });
}

async function searchDocumentChunks(documentId, questionEmbedding) {
    await ensureDocumentIdPayloadIndex();

    return qdrant.query(COLLECTION_NAME, {
        query: questionEmbedding,
        limit: 3,
        with_payload: true,
        filter: {
            must: [
                {
                    key: 'documentId',
                    match: {
                        value: documentId
                    }
                }
            ]
        }
    });
}

module.exports = {
    createCollectionIfNeeded,
    searchDocumentChunks,
    upsertDocumentChunks
};
