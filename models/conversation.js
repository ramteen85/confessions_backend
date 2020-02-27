const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = mongoose.Schema({
    participants: [
        {
            senderId: {
                type: Schema.ObjectId,
                ref: 'User'
            },
            receiverId: {
                type: Schema.ObjectId,
                ref: 'User'
            },
        }
    ]
});

module.exports = mongoose.model('Conversation', conversationSchema);