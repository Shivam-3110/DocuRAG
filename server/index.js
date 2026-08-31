const express = require('express');
const multer = require('multer');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
const pdfParse = require('pdf-parse');

const upload = multer({ dest: 'Uploads/' });
app.get("/",(req,res)=>{
    res.send("server is running");
})

app.post('/upload',upload.single('pdf'),async (req,res)=>{
        console.log(req.file);
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;
    const chunks = text.split('\n\n');
    res.json({
        totalChunks:chunks.length,
        chunks:chunks
    })
})
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});