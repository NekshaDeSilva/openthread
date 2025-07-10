const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { Log } = require("../Handlers/Logger");

const threadSchema = new Schema({
    user_ID: String,
    content: { type: String, required: true, maxlength: 280 },
    comments: [{
        user_ID: String,
        content: { type: String, required: true, maxlength: 280 },
        hashtags: [{ type: String, maxlength: 64 }],
        reposts: {
            number: { type: Number, default: 0 },
            users: [{ type: String }]
        },
        likes:{
            number: { type: Number, default: 0 },
            users: [{ type: String }]
        },
        date: { type: Date, default: Date.now },
        updatedAt: { type: Date },
        edited: { type: Boolean, default: false },
        reposted: {
            status: { type: Boolean, default: false },
            original: String
        },
    }],
    hashtags: [{ type: String, maxlength: 64 }],
    views: { type: Number, default: 0 },
    reposts: {
        number: { type: Number, default: 0 },
        users: [{ type: String }]
    },
    likes: {
        number: { type: Number, default: 0 },
        users: [{ type: String }]
    },
    date: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    edited: { type: Boolean, default: false },
    reposted: {
        status: { type: Boolean, default: false },
        original: String
    },
})

threadSchema.pre('save', async function (next) {
    if (this.isNew) {
        Log("New Thread Created: " + this._id)
    } else {
        Log("Thread Updated: " + this._id);
    }

    next();
});

module.exports = mongoose.model("Thread", threadSchema);