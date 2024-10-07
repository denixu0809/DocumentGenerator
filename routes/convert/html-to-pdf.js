const express = require("express");
const router = express.Router();
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const Client = require('../../models/Client'); 

router.use(bodyParser.text({ type: 'text/html' }));

router.post('/', checkApiKey, async (req, res) => {
    const html = req.body;

    if (!html) {
        return res.status(400).send('No HTML content provided');
    }

    try {
        // Launch a new instance of Chromium
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();

        // Set the content of the page to the provided HTML
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 }); // Increased timeout

        // Modify the DOM to replace image alt attributes with src attributes
        await page.evaluate(() => {
            const images = document.querySelectorAll('img[alt]');
            images.forEach(img => {
                if (img.alt) {
                    img.src = img.alt;
                    img.alt = '';
                }
            });
        });

        // Generate PDF from the page content with margins
        const pdfBuffer = await page.pdf({
            format: 'A4',
            timeout: 120000,
            printBackground: true
        });

        // Close the browser instance
        await browser.close();

        // Set the response headers and send the PDF buffer
        res.set('Content-Type', 'application/pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function checkApiKey(req, res, next) {
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: API Key missing' });
  }

  try {
    // Find the client with the provided API key
    const client = await Client.findOne({ api_key: apiKey });

    if (!client) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    if (client.remaining_credit <= 0) {
        return res.status(403).json({ error: 'Forbidden: No remaining credit' });
    }

    // Increase the used_credit field (ensure you add proper checks for the credit values in your actual logic)
    client.used_credit += 1; // Adjust the increment logic as needed
    await client.save();

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Error checking API key:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = router;