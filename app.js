// imports
const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');

// socket.io
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);

// sockets
require('./socket/confessions')(io);
require('./socket/private')(io);


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
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});

app.use(helmet());
app.use(compression());

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

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_ATLAS_SERVER}/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true })
.then(result => {
    server.listen(PORT, () => {
        console.log('Server started...');
    });
}).catch(err => {
    console.log(err);
});