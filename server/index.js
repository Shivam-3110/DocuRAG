const express = require('express');
const multer = require('multer');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
const pdfParse = require('pdf-parse');
const {GoogleGenAI} = require('@google/genai');
const upload = multer({ dest: 'Uploads/' });
require('dotenv').config();
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
const {QdrantClient} = require('@qdrant/js-client-rest');

const qdrant = new QdrantClient({
    url: process.env.QUADRANT_URL,
    apiKey: process.env.QUADRANT_API_KEY
});

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

app.get("/",(req,res)=>{
    res.send("server is running");
})

app.get("/create-collection", async (req, res) => {
    try {
         await qdrant.createCollection('pdf-docs',{
            vectors: {
                size:3072,
                distance: 'Cosine'
            }
        });
        res.send('Collection created successfully');
    }
    catch(e){
        console.error('Error fetching collections:', e);
        res.status(500).send('Error fetching collections');
    }
})


app.post('/upload',upload.single('pdf'),async (req,res)=>{
        console.log(req.file);
        console.log(req.body);
        try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;
    const chunks = text.split('\n\n').filter(chunk => chunk.trim() !== '');
      console.log(chunks);
    const chunkEmbeddings = [];
    for (const chunk of chunks) {
        const embedding = await createEmbedding(chunk);
        chunkEmbeddings.push({
            text: chunk,
            embedding: embedding
        });
    }
    
    const points = chunkEmbeddings.map((item, index) => ({
        id: index+1,
        vector: item.embedding,
        payload: { text: item.text }
    }));
     
    await qdrant.upsert('pdf-docs', {
    wait: true,
    points: points
});

    const question = req.body.question;
    const questionEmbedding = await createEmbedding(question);

     const searchResult = await qdrant.query('pdf-docs', {
        vector: questionEmbedding,
        limit: 1,
        with_payload: true
    });  
     console.log(searchResult);
    const bestChunk = searchResult.points[0].payload.text;
    console.log(bestChunk);

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: `Answer the question using the context provided: ${bestChunk} \n\n Question: ${question}`,
        })
      res.send(response.text);
    }
    catch (error) {
        console.error('Error parsing PDF:', error);
        res.status(500).send('Error parsing PDF');
    }  
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});