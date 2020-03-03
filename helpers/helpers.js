const User = require('../models/user');

module.exports = {
    updateChatList: async (req, message) => {
    await User.update(
        {
        _id: req.user._id
        },
        {
        $pull: {
            chatList: {
            receiverId: req.params.receiverId
            }
        }
        }
    );

    await User.update(
        {
        _id: req.params.receiverId
        },
        {
        $pull: {
            chatList: {
            receiverId: req.user._id
            }
        }
        }
    );

    await User.update(
        {
        _id: req.user._id
        },
        {
        $push: {
            chatList: {
            $each: [
                {
                receiverId: req.params.receiverId,
                msgId: message._id
                }
            ],
            $position: 0
            }
        }
        }
    );

    await User.update(
        {
        _id: req.params.receiver_Id
        },
        {
        $push: {
            chatList: {
            $each: [
                {
                receiverId: req.user._id,
                msgId: message._id
                }
            ],
            $position: 0
            }
        }
        }
    );
    }
}