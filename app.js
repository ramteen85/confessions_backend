// imports
const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

// socket.io
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
require('./socket/confessions')(io);


// import routes
// const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const confessionRoutes = require('./routes/confession');
const messageRoutes = require('./routes/message');


const PORT = process.env.PORT || 8080;

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded
app.use(bodyParser.json()); // application/json
// to use the /images folder in the frond end
app.use('/images', express.static(path.join(__dirname, 'images')));



// CORS - multiple domains can be separated by commas
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

//route files
// app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);
app.use('/confessions', confessionRoutes);
app.use('/messages', messageRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({
        message: message,
        data: data
    });
});

let endpoint = 'confessions';

databaseUrl = 'mongodb+srv://ram:lMEFmOYQFS1kL5ou@chatmania-fowek.mongodb.net/' + endpoint + '?retryWrites=true&w=majority';

mongoose.connect(databaseUrl, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })
.then(result => {
    server.listen(PORT, () => {
        console.log('Server started...');
    });
}).catch(err => {
    console.log(err);
});