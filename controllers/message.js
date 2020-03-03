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

        const {senderId, receiverId} = req.params;

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        Conversation.findOne({
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
        .select('_id')
        .then( data => {
            if(data === null)
            {
                res.status(200).json({
                  error: "No Conversation Exists",
                  messages: {
                    message: []
                  }

                });
            }
            console.log(data);
            if(data) {
                Message.findOne({conversationId: data._id})
                .then(messages => {
                    res.status(200).json({
                        message: 'Messages Returned!',
                        messages: messages,
                        senderName: sender.nickname,
                        receiverName: receiver.nickname
                    });
                })
                .catch(err => {
                    console.log('Could not get messages', err);
                });
            }

        })
        .catch(err => {
            console.log(err);
        });

        console.log('conversation ?????');
    },
    sendMessage(req, res, next) {

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

        // get variables
        senderId = req.body.convData.senderId;
        receiverId = req.body.convData.receiverId;
        message = req.body.convData.message;

        console.log('request body:', req.body);
        


        console.log('value', receiverId);

        // check for previous conversations
        Conversation.find({
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
        },
         async(err, result) => {

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
                })
                .then(() => {
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
                })
                .catch(err => {
                    res.status(500).json({
                        message: "Error occurred sending message!"
                    });
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
                .save()
                .then(() => {
                    res.status(200).json({
                        message: "message sent",
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        message: "Error occurred sending message!"
                    });
                });

            }
        });
    }
};


