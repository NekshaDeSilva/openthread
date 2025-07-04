require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Log } = require("../Handlers/Logger");
const bcrypt = require("bcrypt");
const axios = require("axios");

const User = require("../Models/User");
const Thread = require("../Models/Thread");

const Authenticated = (req, res, next) => {
    if (!req.session.userId) {
        res.status(403).json({message: "Unauthorized"});
    } else {
        next();
    }
};

router.post("/register", async (req, res, next) => {
    try {
        if(req.session.user_ID) return res.status(400).json({ message: "Already Authenticated" });

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
        if(req.session.user_ID) return res.status(400).json({ message: "Already Authenticated" });
        let { username, password } = req.body;

        let existingUser = await User.findOne({$or: [{email: username}, {username: username}]})
        if (existingUser) {
            const isMatch = await bcrypt.compare(password, existingUser.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid Credentials" });
            }

            req.session.user_ID = existingUser.id;
            req.session.user_Email = existingUser.email;
            req.session.user_Username = existingUser.username;
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

router.post("/logout", Authenticated, async (req, res, next) => {
    try {
            req.session.destroy((err) => {
                if (err) {
                    Log("An error occurred while logging out user: \n" + err);
                    return res.status(500).json({ message: "Internal Server Error" });
                }
                res.status(200).json({ message: "Logged out successfully" });
            });
    } catch (err) {
        Log("An error occurred while logging out user: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.post("/post", Authenticated, async (req, res, next) => {
    try {
        let { content } = req.body;

        if (content.length > 280) return res.status(400).json({ message: "Content Character Limit Exceeded" });

        let thread = new Thread({
            user_id: req.session.user_ID,
            content: content,
        });
        await thread.save();

        res.status(200).json({
            thread: {
                id: thread.id,
                userId: req.session.user_ID,
                content: content,
            }
        });
    } catch (err) {
        Log("An error occurred while creating a thread: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.post("/comment", Authenticated, async (req, res, next) => {
    try {
        let { thread_ID, content } = req.body;
        let thread = await Thread.findOne({ id: thread_ID });

        if (content.length > 280) return res.status(400).json({ message: "Content Character Limit Exceeded" });
        if (!thread) return res.status(404).json({ message: "Thread Not Found" });

        let updatedThread = await Thread.findOneAndUpdate({ id: thread_ID }, { $push: { comments: { user_id: req.session.user_ID, content: content } }},{ new: true })

        const newComment = updatedThread.comments[updatedThread.comments.length - 1];

        res.status(200).json({
            comment: {
                id: newComment.id,
                userId: req.session.user_ID,
                content: content,
            }
        });
    } catch (err) {
        Log("An error occurred while creating a comment: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.post("/upload", Authenticated, async (req, res, next) => {
    try{
        const { dir, name, content } = req.body;
        if (!dir || !name || !content) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const storageServerUrl = process.env.STORAGE_SERVER_URL + "upload";
        const secretToken = process.env.STORAGE_SECRET_TOKEN;

        const response = await axios.post(
            storageServerUrl,
            { dir, name, content },
            { headers: { "x-upload-secret": secretToken } }
        );

        res.status(response.status).json(response.data);
    }catch (err){
        Log("An error occurred while uploading file: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})


module.exports = router;