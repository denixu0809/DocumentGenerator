const mongoose = require('mongoose');

const uri = "mongodb+srv://admin:admin@koti-api.r9sbt.mongodb.net/koti-api?retryWrites=true&w=majority&appName=koti-api";

const connectDB = async () => {
    mongoose.connect(uri)
        .then(() => {
            console.log('Successfully connected to MongoDB');
        })
        .catch((error) => {
            console.error('Failed to connect to MongoDB', error);
        });
};

module.exports = connectDB;

