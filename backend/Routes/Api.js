require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Log } = require("../Handlers/Logger");
const bcrypt = require("bcrypt");

const User = require("../Models/User");

router.post("/register", async (req, res, next) => {
    try {
        let { username, name, email, age, password, contact } = req.body;

        let existingUser = await User.findOne({$or: [{email: email}, {username: username}]})
        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ? 'Email already exists' : 'Username already exists'
            });
        }

        const salt = await bcrypt.genSalt(12);
        let user = new User({
            username: username,
            name: name,
            email: email,
            age: age,
            password: await bcrypt.hash(password, salt),
            contact: contact
        });
        await user.save();

        res.status(200).json({
            user: {
                _id: user._id,
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                age: user.age,
                contact: user.contact,
                joinDate: user.joinDate,
                admin: user.admin
            }
        })
    }
    catch (err) {
        Log("An error occurred while registering new user: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.post("/login", async (req, res, next) => {
    try {
        let { username, password } = req.body;

        let existingUser = await User.findOne({$or: [{email: username}, {username: username}]})
        if (existingUser) {
            const isMatch = await bcrypt.compare(password, existingUser.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid Credentials" });
            }

            res.status(200).json({
                user: {
                    _id: existingUser._id,
                    id: existingUser.id,
                    username: existingUser.username,
                    name: existingUser.name,
                    email: existingUser.email,
                    age: existingUser.age,
                    contact: existingUser.contact,
                    joinDate: existingUser.joinDate,
                    admin: existingUser.admin
                }
            });
        }else{
            return res.status(400).json({ message: "No User Found" });
        }
    }
    catch (err) {
        Log("An error occurred while login user: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

module.exports = router;