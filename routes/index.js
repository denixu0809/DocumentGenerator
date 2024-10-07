const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const Client = require("../models/Client");
const isAuthenticated = require('../middleware/auth');


router.use(bodyParser.json()); // For parsing application/json
router.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded


router.get('/', (req, res) => {
    try {
        // Send the index.html file as a response
        res.render('index');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


  // Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).send('Logout failed');
    } else {
      res.redirect('/login');
    }
  });
});



const clientsRouter = require("./Index/clients");
router.use("/clients", clientsRouter);


const loginRouter = require("./Index/login");
router.use("/login", loginRouter);

module.exports = router;