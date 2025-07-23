
const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const googleGenAI = require('@google/generative-ai');
const GoogleGenerativeAI = googleGenAI.GoogleGenerativeAI;

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });

const upload = multer({ dest: 'uploads/' });

app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ output: response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

const imageToGenerativePart = (imagePath) => ({
    inlineData: {
        data: fs.readFileSync(imagePath).toString('base64'),
        mimeType: 'image/png',
    },
});

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    const prompt = req.body.prompt || 'Describe this image.';
    const image = imageToGenerativePart(req.file.path);

    try {
        const result = await model.generateContent(prompt, image);
        const response = await result.response;
        res.json({ output: response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const base64Data = buffer.toString('base64');
    const mimeType = req.file.mimetype;

    try {
        const documentPart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };
        const result = await model.generateContent('Analyse this document', documentPart);
        const response = await result.response;
        res.json({ output: response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    const audioBuffer = fs.readFileSync(req.file.path);
    const base64Audio = audioBuffer.toString('base64');
    const audioPart = {
        inlineData: {
            data: base64Audio,
            mimeType: req.file.mimetype,
        },
    };

    try {
        const result = await model.generateContent([
            'Transcribe or analyse the following audio.',
            'Describe what is being said in this audio.',
            audioPart
        ]);
        const response = await result.response;
        res.json({ output: response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// S4 -> 1:49: