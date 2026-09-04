const {GoogleGenAI} = require('@google/genai');

const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

async function generateAnswer(context, question) {
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: `You are answering questions about a PDF.

Use only the information provided in the context.

If the answer cannot be found in the context, say:
"I couldn't find the answer in the provided PDF."

Do not make up information.

Context:
${context}

Question:
${question}`,
    });

    return response.text;
}

module.exports = {
    generateAnswer
};
