const {GoogleGenAI} = require('@google/genai');

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

async function createEmbedding(text) {
    const response = await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: text,
        config: {
            outputDimensionality: 3072
        }
    });

    return response.embeddings[0].values;
}

module.exports = {
    createEmbedding
};
