const express = require('express');
const {body} = require('express-validator');

const User = require('../models/user');
const imgController = require('../controllers/image');

const router = express.Router();

// upload an image
router.post('/upload', imgController.upload);


module.exports = router;