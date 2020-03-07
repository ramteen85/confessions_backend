const jwt = require('jsonwebtoken');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const User = require('../models/user');
const Helper = require('../helpers/helpers');

module.exports = {
    async getAllMessages(req, res, next) {


        // verify token
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        } catch(err) {
            err.statusCode = 500;
            next(err)
        }

        try {

            const {senderId, receiverId} = req.params;

            const sender = await User.findById(senderId);
            const receiver = await User.findById(receiverId);

            let data = await Conversation.findOne({
                $or: [
                    {
                        $and: [
                            {'participants.senderId': senderId},
                            {'participants.receiverId': receiverId}
                        ]
                    },
                    {
                        $and: [
                            {'participants.senderId': receiverId},
                            {'participants.receiverId': senderId}
                        ]
                    }
                ]
            })
            .select('_id');

            if(data === null)
            {
                res.status(200).json({
                    error: "No Conversation Exists",
                    messages: {
                        message: []
                    }
                });
            }
            if(data) {
                let messages = Message.findOne({conversationId: data._id});

                res.status(200).json({
                    message: 'Messages Returned!',
                    messages: messages,
                    senderName: sender.nickname,
                    receiverName: receiver.nickname
                });
            }
        }
        catch(err) {
            err.message = "Could not get messages...";
            err.statusCode = 500;
            next(err);
        };
    },
    async markAllRead(req, res, next) {

        // get token
        token = req.body.data.token;

        // verify token
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.SECRET_KEY)
        } catch(err) {
            err.statusCode = 500;
            throw err;
        }

        try {

            const senderId = req.body.data.senderId;

            console.log(`Sender ID: ${senderId}`);

            const msg = await Message.find({
                $or: [
                    { receiver: senderId },
                    { sender: senderId }
                ]
            });

            if(msg.length > 0) {
                msg.forEach(async value => {
                    value.message.forEach(async body => {
                        if(body.receiverId == senderId) {
                            await Message.updateOne(
                                {
                                    'message._id': body._id
                                },
                                { $set: { 'message.$.isRead': true } }
                            );
                        }
                    });
                });
                res.status(200).json({
                    message: 'All Messages Marked as Read!'
                });
            }
        }
        catch(err) {
            err.statusCode = 500;
            err.message = 'error occurred marking all messages';
            next(err);
        }
    },
    async markRead(req, res, next) {

        // get token
        token = req.body.data.token;

        // verify token
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.SECRET_KEY)
        } catch(err) {
            err.statusCode = 500;
            throw err;
        }

        try {

            const senderId = req.body.data.senderId;
            const receiverId = req.body.data.receiverId;

            console.log(`Sender ID: ${senderId}`);
            console.log(`Receiver ID: ${receiverId}`);

            let conversation = await Conversation.findOne({
                $or: [
                    {
                        $and: [
                            {'participants.senderId': senderId},
                            {'participants.receiverId': receiverId}
                        ]
                    },
                    {
                        $and: [
                            {'participants.senderId': receiverId},
                            {'participants.receiverId': senderId}
                        ]
                    }
                ]
            })
            .select('_id');

            if(conversation === null)
            {
                error = new Error();
                error.message = 'No Conversations found';
                throw error;
            }

            let messages = await Message.findOne({conversationId: conversation._id});

            if(messages.message.length > 0) {
                messages.message.forEach( async (message) => {
                        await Message.updateOne({
                            'message._id': message._id
                        },
                        {
                            $set: { 'message.$.isRead': true }
                        });
                });
                console.log('Messages Read!');
                res.status(200).json({
                    message: 'Messages marked as read!'
                });
            }
        }
        catch(err) {
            err.statusCode = 500;
            if(!err.message)
                err.message = 'Error occurred marking selective messages...';
            next(err);
        }
    },
    async sendMessage(req, res, next) {

        // get tokens
        token = req.body.convData.token;

        // verify token
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.SECRET_KEY);
        } catch(err) {
            err.statusCode = 500;
            next(err)
        }

        try {

            // get variables
            senderId = req.body.convData.senderId;
            receiverId = req.body.convData.receiverId;
            message = req.body.convData.message;

            console.log('request body:', req.body);


            console.log('value', receiverId);

            // check for previous conversations
            let result = await Conversation.find({
                $or: [
                    {
                        participants: {
                            $elemMatch: {
                                senderId: senderId,
                                receiverId: receiverId
                            }
                        }
                    },
                    {
                        participants: {
                            $elemMatch: {
                                senderId: receiverId,
                                receiverId: senderId
                            }
                        }
                    }
                ]
            });

            sender = await User.findById(senderId);
            receiver = await User.findById(receiverId);


            if(result !== null && result.length > 0) {
                const msg = await Message.findOne({conversationId: result[0]._id});
                Helper.updateChatList(req, msg);
                await Message.update({
                    conversationId: result[0]._id
                }, {
                    $push: {
                        message: {
                            senderId: senderId,
                            receiverId: receiverId,
                            senderName: sender.nickname,
                            receiverName: receiver.nickname,
                            body: message
                        }
                    }
                });
                res.status(200).json({
                    message: "message sent successfully",
                    data: {
                        senderId: senderId,
                        receiverId: receiverId,
                        senderName: sender.nickname,
                        receiverName: receiver.nickname,
                        body: message
                    }
                });
            } else {
                const newConversation = new Conversation();
                newConversation.participants.push({
                    senderId: senderId,
                    receiverId: receiverId
                });

                const saveConversation = await newConversation.save();

                const newMessage = new Message();
                newMessage.conversationId = saveConversation._id;
                newMessage.sender = senderId;
                newMessage.receiver = receiverId;

                newMessage.message.push({
                    senderId: senderId,
                    receiverId: receiverId,
                    senderName: sender.nickname,
                    receiverName: receiver.nickname,
                    body: message
                });

                await User.updateOne({
                    id: senderId,
                }, {
                    $push: {
                        chatList: {
                            $each: [
                                {
                                    receiverId: receiverId,
                                    msgId: newMessage._id
                                }
                            ],
                            $position: 0
                        }
                    }
                });

                await User.updateOne({
                    id: receiverId,
                }, {
                    $push: {
                        chatList: {
                            $each: [
                                {
                                    receiverId: senderId,
                                    msgId: newMessage._id
                                }
                            ],
                            $position: 0
                        }
                    }
                });

                await newMessage
                .save();
                res.status(200).json({
                    message: "message sent",
                });
            }
        }
        catch(err) {
            err.statusCode = 500;
            if(!err.message)
                err.message = "error occurred sending message...";
            next(err);
        }
    }
};


