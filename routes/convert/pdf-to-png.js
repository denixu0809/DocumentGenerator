const express = require("express");
const router = express.Router();
const { fromPath } = require("pdf2pic");
const Client = require('../../models/Client');
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require('uuid'); // Import UUID for unique folder names

// Function to convert PDF from base64 to PNG images
async function convertPdfBase64ToPngBase64(pdfBase64) {
    // Decode the base64 PDF data
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Create a unique temporary folder
    const tempFolder = path.join(__dirname, 'tmp', uuidv4());
    fs.mkdirSync(tempFolder); // Create the temporary folder

    // Define the path for the temporary PDF file
    const tempPdfPath = path.join(tempFolder, 'temp.pdf');
    fs.writeFileSync(tempPdfPath, pdfBuffer); // Write the buffer to the temporary PDF file

    const options = {
        density: 300,
        savePath: tempFolder, // Save PNG images in the temporary folder
        format: "png",
        width: 2480,
        height: 3508 
    };

    const storeAsImage = fromPath(tempPdfPath, options);
    const pngBase64Array = [];

    try {
        // Convert PDF to PNG images
        const pdfDoc = await storeAsImage.bulk(-1); // -1 means all pages
        
        for (let i = 0; i < pdfDoc.length; i++) {
            const imagePath = pdfDoc[i].path;
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');
            pngBase64Array.push(base64Image);
        }
    } catch (error) {
        console.error('Error during PDF to PNG conversion:', error);
        throw new Error('PDF to PNG conversion failed');
    } finally {
        
        // Clean up temporary PDF file and folder
        fs.unlinkSync(tempPdfPath); // Remove the temporary PDF file

        // Delete all PNG files in the temporary folder
        const files = fs.readdirSync(tempFolder);
        for (const file of files) {
            fs.unlinkSync(path.join(tempFolder, file)); // Remove each PNG file
        }
        fs.rmdirSync(tempFolder); // Remove the temporary folder 
    }

    return pngBase64Array; // Returns an array of base64 PNG data
}

// Route to handle PDF to PNG conversion
router.post('/', bodyParser.json({ limit: '10mb' }), bodyParser.urlencoded({ limit: '10mb', extended: true }), checkApiKey, async (req, res) => {
    const pdfData = req.body.pdfBase64;

    if (!pdfData) {
        return res.status(400).send('No PDF data provided');
    }

    // Extract the base64 data
    const base64Data = pdfData;

    try {
        // Convert PDF to PNG
        const pngImages = await convertPdfBase64ToPngBase64(base64Data);

        // Send back the base64 PNG images
        res.set('Content-Type', 'application/json');
        res.json(pngImages.map((image, index) => ({
            page: index + 1,
            image
        })));
    } catch (error) {
        console.error('Error converting PDF to PNG:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Middleware to check API Key
async function checkApiKey(req, res, next) {
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
        return res.status(401).json({ error: 'Unauthorized: API Key missing' });
    }

    try {
        const client = await Client.findOne({ api_key: apiKey });

        if (!client) {
            return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
        }

        if (client.remaining_credit <= 0) {
            return res.status(403).json({ error: 'Forbidden: No remaining credit' });
        }

        client.used_credit += 1; // Adjust the increment logic as needed
        await client.save();

        next();
    } catch (error) {
        console.error('Error checking API key:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = router;
