const express = require('express');
require('dotenv').config();
const uploadRoutes = require('./routes/upload');
const askRoutes = require('./routes/ask');
const { createCollectionIfNeeded } = require('./services/qdrantService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/",(req,res)=>{
    res.send("server is running");
})

app.get("/create-collection", async (req, res) => {
    try {
        await createCollectionIfNeeded();
        res.send('Collection created successfully');
    }
    catch(e){
        console.error('Error fetching collections:', e);
        res.status(500).send('Error fetching collections');
    }
})

app.use('/upload', uploadRoutes);
app.use('/ask', askRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
