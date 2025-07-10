const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { Log } = require("../Handlers/Logger");

const userSchema = new Schema({
    username: { type: String, unique: true },
    name: String,
    email: { type: String, unique: true },
    age: Number,
    password: { type: String, minlength: 8 },
    contact: String,
    joinDate: { type: Date, default: Date.now },
    admin: { type: Boolean, default: false },
    bio: { type: String, maxlength: 128 },
    links: {
        github: { type: String, maxlength: 128 },
        linkedin: { type: String, maxlength: 128 },
        website: { type: String, maxlength: 128 }
    },
    avatar: { type: String, default: "" }
})

userSchema.pre('save', async function (next) {
    if (this.isNew) {
        Log("New User Created: " + this._id)
    } else {
        Log("User Updated: " + this._id);
    }

    next();
});

module.exports = mongoose.model("User", userSchema);