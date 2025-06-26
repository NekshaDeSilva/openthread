const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { Log } = require("../Handlers/Logger");

(userSchema = new Schema({
    id: {type: String, unique: true},
    username: String,
    name: String,
    email: String,
    age: Number,
    password: String,
    contact: String,
    joinDate: {type: Date, default: Date.now},
    admin: {type: Boolean, default: false},
})),
    userSchema.pre('save', async function(next) {
        function ID() {
            const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result           = '';
            for (let i = 0; i < 5; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        }
        if (this.isNew) {
            this.id = ID()
            Log("New User Created: " + this.id)
        }else{
            Log("User Updated: " + this.id);
        }
        next();
    });
(User = mongoose.model("User", userSchema));

module.exports = User;