const express = require("express");
const router = express.Router();
const Client = require("../../models/Client");
const isAuthenticated = require('../../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
      
      const clients = await Client.find(); // Fetch all clients
      res.render('clients', { clients }); // Pass clients to the EJS template
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).send('Internal Server Error');
    }
  });

router.post('/new', isAuthenticated, async (req, res) => {
    const { name, email, credit} = req.body;

    try {
        const existingClient = await Client.findOne({ email });
        if(existingClient){
            return res.render('register', { error: 'Already have a client with this email address.' });
        }
        // Create a new client instance
        const newClient = new Client({
            name,
            email,
            total_credit: Number(credit)
        });

        // Save the new client to the database
        await newClient.save();

        // Redirect or send a success message
        res.redirect('/clients'); // Adjust redirection as needed

    } catch (error) {
        console.error(error);
        // Render the form again with an error message
        res.render('register', { error: 'Registration failed. Please try again.' });
    }
});

// Route to add credit to a client
router.post('/add-credit/:id', async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        const additionalCredit = parseInt(req.body.additional_credit, 10);
        if (!isNaN(additionalCredit) && additionalCredit > 0) {
            client.total_credit += additionalCredit;
            await client.save();
            res.redirect('/clients'); // Redirect back to the client list page
        } else {
            res.status(400).send('Invalid credit amount');
        }
    } catch (error) {
        res.status(400).send('Unable to add credit');
    }
});

// Route to delete a client
router.post('/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.redirect('/clients'); // Redirect back to the client list page
    } catch (error) {
        res.status(400).send('Unable to delete client');
    }
});

module.exports = router;