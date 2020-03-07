const express = require('express');

const router = express.Router();

const messageController = require('../controllers/message');

// get all messages
router.post('/get/:senderId/:receiverId', messageController.getAllMessages);

// send a message
router.post('/send', messageController.sendMessage);


// mark messages as read
router.post('/markread', messageController.markRead);

module.exports = router;