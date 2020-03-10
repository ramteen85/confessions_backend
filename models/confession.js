const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment-timezone');
const timeZone = require('mongoose-timezone');

// confession schema
const confessionSchema = new Schema({
    creator: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    categories: [{
        type: String
    }],
    totalHearts: {
        type: Number,
        default: 0
    },
    totalHates: {
        type: Number,
        default: 0
    },
    popScore: {
        type: Number,
        default: 0
    },
    usersHearted: [{
        type: Schema.ObjectId,
        ref: 'user'
    }],
    usersHated: [{
        type: Schema.ObjectId,
        ref: 'user'
    }],
    content: {
        type: String    ,
        required: true
    },
    imageUrl: {
        type: String
    },
    edited: {
        type: Boolean,
        default: false
    },
    location: {
        type: { type: String },
        coordinates: [],
    },
    picVersion: {
        type: String,
        default: ''
    },
    picId: {
        type: String,
        default: ''
    },
    image: {
        imgId: {
            type: String,
            default: ''
        },
        imgVersion: {
            type: String,
            default: ''
        }
    },
    createdAt: {
        type: Date,
        default: moment.tz(Date.now(), "Australia/Sydney")
    }
});

confessionSchema.index({ location: "2dsphere" });

confessionSchema.plugin(timeZone, { paths: ['date', 'createdAt'] });

module.exports = mongoose.model('Confession', confessionSchema);