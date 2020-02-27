const express = require('express');

const router = express.Router();

const messageController = require('../controllers/message');

// get all messages
router.post('/get/:senderId/:receiverId', messageController.getAllMessages);

// send a message
router.post('/send', messageController.sendMessage);

module.exports = router;