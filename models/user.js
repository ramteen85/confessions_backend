const mongoose = require('mongoose');
const moment = require('moment-timezone');
const timeZone = require('mongoose-timezone');
const Schema = mongoose.Schema;

// user schema
const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        default: 'Anonymous'
    },
    gender: {
        type: String,
        default: 'male',
        required: true
    },
    country: {
        type: String,
        default: ''
    },
    countryCode: {
        type: String,
        default: ''
    },
    state: {
        type: String,
        default: ''
    },
    suburb: {
        type: String,
        default: ''
    },
    streetNumber: {
        type: String,
        default: ''
    },
    streetName: {
        type: String,
        default: ''
    },
    postcode: {
        type: String,
        default: ''
    },
    trueLoc: {
        type: Boolean,
        default: false
    },
    accessLevel: {
        type: Number,
        default: 0
    },
    prevLocs: {
        type: Array,
        default: []
    },
    location: {
        type: { type: String },
        coordinates: [],
    },
    confessionList: [
        {
            confessionId: {type: Schema.ObjectId, ref: "Confession"},
            subject: { type: String },
            content: { type: String },
            imageUrl: { type: String },
            createdAt: { type: Date, default: moment.tz(Date.now(), "Australia/Sydney") }
        },
    ],
    distance: {
        type: Number,
        default: 50
    },
    chatList: [
        {
            receiverId: {type: Schema.ObjectId, ref: "User"},
            msgId: {type: Schema.ObjectId, ref: "Message"}
        },
    ],
    createdAt: {
        type: Date,
        default: moment.tz(Date.now(), "Australia/Sydney")
    }
});

userSchema.index({ "location": "2dsphere" });

userSchema.plugin(timeZone, { paths: ['date', 'createdAt'] });

module.exports = mongoose.model('User', userSchema);