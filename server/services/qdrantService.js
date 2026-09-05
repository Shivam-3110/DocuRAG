const { randomUUID } = require('crypto');
const {QdrantClient} = require('@qdrant/js-client-rest');

const COLLECTION_NAME = 'pdf-docs';

const qdrant = new QdrantClient({
    url: process.env.QUADRANT_URL,
    apiKey: process.env.QUADRANT_API_KEY
});

let documentIdIndexReady = false;
let documentHashIndexReady = false;

async function ensurePayloadIndex(fieldName, fieldSchema) {
    if (fieldName === 'documentId' && documentIdIndexReady) {
        return;
    }

    if (fieldName === 'documentHash' && documentHashIndexReady) {
        return;
    }

    try {
        await qdrant.createPayloadIndex(COLLECTION_NAME, {
            field_name: fieldName,
            field_schema: fieldSchema,
            wait: true
        });
        if (fieldName === 'documentId') {
            documentIdIndexReady = true;
        }
        if (fieldName === 'documentHash') {
            documentHashIndexReady = true;
        }
    } catch (error) {
        const message = error?.data?.status?.error || error.message || '';
        if (message.toLowerCase().includes('already exists')) {
            if (fieldName === 'documentId') {
                documentIdIndexReady = true;
            }
            if (fieldName === 'documentHash') {
                documentHashIndexReady = true;
            }
            return;
        }

        throw error;
    }
}

async function ensureDocumentIdPayloadIndex() {
    await ensurePayloadIndex('documentId', 'uuid');
}

async function ensureDocumentHashPayloadIndex() {
    await ensurePayloadIndex('documentHash', 'keyword');
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
    await ensureDocumentHashPayloadIndex();
}

async function findDocumentByHash(documentHash) {
    await createCollectionIfNeeded();

    const existingDocument = await qdrant.scroll(COLLECTION_NAME, {
        filter: {
            must: [
                {
                    key: 'documentHash',
                    match: {
                        value: documentHash
                    }
                }
            ]
        },
        limit: 1,
        with_payload: true
    });

    const existingPoint = existingDocument.points && existingDocument.points[0];
    return existingPoint ? existingPoint.payload : null;
}

async function upsertDocumentChunks(documentId, documentHash, chunkEmbeddings) {
    const points = chunkEmbeddings.map((item) => ({
        id: randomUUID(),
        vector: item.embedding,
        payload: {
            text: item.text,
            documentId: documentId,
            documentHash: documentHash
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
    findDocumentByHash,
    searchDocumentChunks,
    upsertDocumentChunks
};
