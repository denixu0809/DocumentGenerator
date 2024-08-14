const https = require("https");

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());

const port = 443;

const fs = require("fs");


// Middleware to parse incoming request bodies as text/html
app.use(bodyParser.text({ type: 'text/html' }));

app.get('/', (req, res) => {
    try {
        // Send the index.html file as a response
        res.sendFile(path.join(__dirname, '/', 'index.html'));
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.post('/convert', async (req, res) => {
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
// Creating object of key and certificate
// for SSL
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/koti-api.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/koti-api.com/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/koti-api.com/chain.pem')
  };

// Creating https server by passing
// options and app object
https.createServer(options, app)
    .listen(port, function (req, res) {
        console.log(`Server is running at :${port}`);
    });