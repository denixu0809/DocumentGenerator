const express = require("express");
const router = express.Router();

const htmlToPdfRouter = require("./convert/html-to-pdf");
const pdfToPNGRouter = require("./convert/pdf-to-png");

router.use("/html-to-pdf", htmlToPdfRouter);
router.use("/pdf-to-png", pdfToPNGRouter);

module.exports = router;