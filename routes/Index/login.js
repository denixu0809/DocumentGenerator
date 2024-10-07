const express = require('express');
const router = express.Router();
const User = require('../../models/User');

// Render login page
router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/clients');
  }
  res.render('login', { title: 'Login' , queryParams: req.query });
});

// Handle login form submission
router.post('/', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });

    if (user && user.password === password) {
        req.session.user = user;
        return res.redirect('/clients'); 
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Login failed');
  }
});

module.exports = router;
