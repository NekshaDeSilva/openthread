const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { Log } = require("../Handlers/Logger");

function ID() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

const threadSchema = new Schema({
    id: { type: String, unique: true, default: ID() },
    user_id: String,
    content: { type: String, required: true, maxlength: 280 },
    comments: [{
        id: { type: String, unique: true, default: ID() },
        user_id: String,
        content: { type: String, required: true, maxlength: 280 },
        date: { type: Date, default: Date.now },
        reposts: {type: Number, default: 0},
        likes: { type: Number, default: 0 },
        edited: { type: Boolean, default: false },
    }],
    views: { type: Number, default: 0 },
    reposts: {type: Number, default: 0},
    likes: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    edited: { type: Boolean, default: false },
})

threadSchema.pre('save', async function (next) {
    if (this.isNew) {
        Log("New Thread Created: " + this.id)
    } else {
        Log("Thread Updated: " + this.id);
    }

    next();
});

module.exports = mongoose.model("Thread", threadSchema);