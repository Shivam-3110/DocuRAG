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

async function createEmbedding(text) {
    const response = await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: text,
        config: {
            outputDimensionality: 768
        }
    });

    return response.embeddings[0].values;
}

app.get("/",(req,res)=>{
    res.send("server is running");
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
    const embedding = await createEmbedding(chunks[0]);
    console.log('Embedding:', embedding);
    const question = req.body.question;
    console.log(question);
    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: `Explain this pdf in simple text: ${chunks[1]}`,
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