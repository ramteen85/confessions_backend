const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = mongoose.Schema({
    conversationId: { type: Schema.ObjectId, ref: "Conversation" },
    sender: { type: String },
    receiver: { type: String },
    message: [
        {
            senderId: { type: Schema.ObjectId, ref: "User" },
            receiverId: { type: Schema.ObjectId, ref: "User" },
            senderName: { type: String },
            receiverName: { type: String },
            body: { type: String, default: '' },
            isRead: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now() },
        }
    ]
});

module.exports = mongoose.model('Message', messageSchema);