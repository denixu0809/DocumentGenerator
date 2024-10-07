
require('dotenv').config();
const connectDB = require('./db/connect');
const https = require("https");
const http = require('http');
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require("fs");

connectDB();

const app = express();
app.use(ensureSecure);

app.use(session({
    secret: 'zxcvb@123', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
  }));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const indexRouter = require("./routes/index");
const convertRouter = require("./routes/convert");
app.use("/", indexRouter);
app.use("/convert", convertRouter);

const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/koti-api.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/koti-api.com/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/koti-api.com/chain.pem')
};

https.createServer(options, app)
    .listen(process.env.SECURE_PORT, function (req, res) {
        console.log(`Server is running at :${process.env.SECURE_PORT}`);
    });

http.createServer(app).listen(process.env.UNSECURE_PORT, () => {
    console.log(`HTTP server listening on port ${process.env.UNSECURE_PORT}`);
});

function ensureSecure(req, res, next) {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        return next();
    }

    if (req.method === 'POST') {
        res.redirect(307, 'https://' + req.headers.host + req.url);
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }
}