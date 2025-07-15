require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Log } = require("../Handlers/Logger");
const bcrypt = require("bcrypt");
const axios = require("axios");

const User = require("../Models/User");
const Thread = require("../Models/Thread");

const Authenticated = (req, res, next) => {
    if (!req.session.user_ID) {
        res.status(403).json({message: "Unauthorized"});
    } else {
        next();
    }
};


// ==================================================== //
// ================== General Routes ================== //
// ==================================================== //


router.get("/user", Authenticated, async (req, res, next) => {
    try {
        let user = await User.findOne({ _id: req.session.user_ID })
            .then((user) => {
                let { password, ...userWithoutPassword } = user.toObject();
                res.status(200).json({ user: userWithoutPassword });
            })
            .catch(err => {
            return res.status(404).json({message: "User Not Found"});
        })
    } catch (err) {
        Log("An error occurred while fetching user: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/user/:id", Authenticated, async (req, res, next) => {
    try {
        let user = await User.findOne({ _id: req.params.id })
            .then((user) => {
                let { password, ...userWithoutPassword } = user.toObject();
                res.status(200).json({  user: userWithoutPassword });
            })
            .catch(err => {
                return res.status(404).json({message: "User Not Found"});
            })
    } catch (err) {
        Log("An error occurred while fetching user: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/posts", async (req, res, next) => {
    try {
        const threads = await Thread.find().sort({ date: -1 }).limit(25)
        res.status(200).json({  threads: threads  });
    } catch (err) {
        Log("An error occurred while fetching threads: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/post/:id", Authenticated, async (req, res, next) => {
    try {
        const thread = await Thread.findOne({ _id: req.params.id })
            .then((thread) => {
                res.status(200).json({ thread: thread });
            })
            .catch(err => {
                return res.status(404).json({message: "Thread Not Found"});
            })
    } catch (err) {
        Log("An error occurred while fetching user: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});



// ==================================================== //
// ===== Authentication/Profile Management Routes ===== //
// ==================================================== //



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

            req.session.user_ID = existingUser._id;
            req.session.user_Email = existingUser.email;
            req.session.user_Username = existingUser.username;
            res.status(200).json({
                user: {
                    _id: existingUser._id,
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



// ==================================================== //
// ============= Thread Management Routes ============= //
// ==================================================== //



router.post("/post", Authenticated, async (req, res, next) => {
    try {
        let { content } = req.body;

        let hashtags = content.match(/#[\w]+/g) || [];

        if(hashtags.length > 0) {
            hashtags = hashtags.map((hashtag) => {
                if (hashtag.length > 64) return res.status(400).json({message: "Hashtag Character Limit Exceeded"});
                return hashtag.toLowerCase()
            });
        } else if(hashtags.length > 8) {
            return res.status(400).json({message: "Hashtag Limit Exceeded"});
        }

        content = content.replace(/#[\w]+/g, "").replace(/\s{2,}/g, " ").trim();
        if (content.length > 280) return res.status(400).json({ message: "Content Character Limit Exceeded" });

        let thread = new Thread({
            user_ID: req.session.user_ID,
            content: content,
            hashtags: hashtags,
        });
        await thread.save();

        res.status(200).json({
            thread: thread
        });
    } catch (err) {
        Log("An error occurred while creating a thread: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.post("/comment", Authenticated, async (req, res, next) => {
    try {
        let { thread_ID, content } = req.body;
        let thread = await Thread.findOne({ _id: thread_ID });

        if (!thread) return res.status(404).json({ message: "Thread Not Found" });

        let hashtags = content.match(/#[\w]+/g) || [];

        if(hashtags.length > 0) {
            hashtags = hashtags.map((hashtag) => {
                if (hashtag.length > 64) return res.status(400).json({message: "Hashtag Character Limit Exceeded"});
                return hashtag.toLowerCase()
            });
        } else if(hashtags.length > 8) {
            return res.status(400).json({message: "Hashtag Limit Exceeded"});
        }

        content = content.replace(/#[\w]+/g, "").replace(/\s{2,}/g, " ").trim();
        if (content.length > 280) return res.status(400).json({ message: "Content Character Limit Exceeded" });

        let updatedThread = await Thread.findOneAndUpdate({ _id: thread_ID }, { $push: { comments: { user_ID: req.session.user_ID, content: content, hashtags: hashtags } }},{ new: true })

        const newComment = updatedThread.comments[updatedThread.comments.length - 1];

        res.status(200).json({
            comment: newComment
        });
    } catch (err) {
        Log("An error occurred while creating a comment: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.post("/post/edit", Authenticated, async (req, res, next) => {
    try {
        let { thread_ID, content } = req.body;

        let thread = await Thread.findOne({ _id: thread_ID })
        if (!thread) return res.status(404).json({ message: "Thread Not Found" });
        if (thread.user_ID !== req.session.user_ID) return res.status(403).json({ message: "Unauthorized"});

        let hashtags = content.match(/#[\w]+/g) || [];

        if(hashtags.length > 0) {
           hashtags = hashtags.map((hashtag) => {
                if (hashtag.length > 64) return res.status(400).json({message: "Hashtag Character Limit Exceeded"});
                return hashtag.toLowerCase()
            });
        } else if(hashtags.length > 8) {
            return res.status(400).json({message: "Hashtag Limit Exceeded"});
        }

        content = content.replace(/#[\w]+/g, "").replace(/\s{2,}/g, " ").trim();

        if (content.length > 280) return res.status(400).json({ message: "Content Character Limit Exceeded" });

        await Thread.findOneAndUpdate({ _id: thread_ID },{
            content: content,
            hashtags: hashtags,
            updatedAt: new Date()
        });

        let updatedThread = await Thread.findOne({ _id: thread_ID });

        res.status(200).json({
            thread: updatedThread
        });
    } catch (err) {
        Log("An error occurred while editing a thread: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.post("/comment/edit", Authenticated, async (req, res, next) => {
    try {
        let { thread_ID, comment_ID, content } = req.body;

        let thread = await Thread.findOne({ _id: thread_ID })
        if(!thread) return res.status(404).json({ message: "Thread Not Found" });
        if(thread.comments.length < 1) return res.status(404).json({ message: "Comment Not Found", comments: thread.comments});

        let filteredComments = thread.comments.filter((comment) => { return String(comment._id) === String(comment_ID) })
        if (filteredComments.length < 1) return res.status(404).json({ message: "Comment Not Found", filteredComments: filteredComments, comments: thread.comments });
        if (filteredComments[0].user_ID !== req.session.user_ID) return res.status(403).json({ message: "Unauthorized" });

        let hashtags = content.match(/#[\w]+/g) || [];

        if(hashtags.length > 0) {
            hashtags = hashtags.map((hashtag) => {
                if (hashtag.length > 64) return res.status(400).json({message: "Hashtag Character Limit Exceeded"});
                return hashtag.toLowerCase()
            });
        } else if(hashtags.length > 8) {
            return res.status(400).json({message: "Hashtag Limit Exceeded"});
        }

        content = content.replace(/#[\w]+/g, "").replace(/\s{2,}/g, " ").trim();
        if (content.length > 280) return res.status(400).json({ message: "Content Character Limit Exceeded" });

        await Thread.findOneAndUpdate({ _id: thread_ID, "comments._id": comment_ID },{ $set: { "comments.$.content": content, "comments.$.hashtags": hashtags, "comments.$.updatedAt": new Date() } });

        let updatedThread = await Thread.findOne({ _id: thread_ID });
        let updatedComment = updatedThread.comments.filter((comment) => { return String(comment._id) === String(comment_ID) });

        res.status(200).json({
            comment: updatedComment[0]
        });
    } catch (err) {
        Log("An error occurred while editing a comment: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.post("/post/like", Authenticated, async (req, res, next) => {
    try {
        let { thread_ID } = req.body;

        let thread = await Thread.findOne({ _id: thread_ID })
        if(!thread) return res.status(404).json({ message: "Thread Not Found" });

        let operation;
        if(thread.likes.users.includes(req.session.user_ID)) {
            await Thread.findOneAndUpdate({ _id: thread_ID },{
                $set: { "likes.number": thread.likes.number - 1 },
                $pull: { "likes.users": req.session.user_ID }
            });

             operation = "dislike"
        }else {
            await Thread.findOneAndUpdate({ _id: thread_ID }, {
                $set: {"likes.number": thread.likes.number + 1},
                $addToSet: {"likes.users": req.session.user_ID}
            });

            operation = "like";
        }

        let updatedThread = await Thread.findOne({ _id: thread_ID });

        res.status(200).json({
            operation: operation,
            thread: updatedThread
        });
    } catch (err) {
        Log("An error occurred while liking a thread: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.post("/comment/like", Authenticated, async (req, res, next) => {
    try {
        let { thread_ID, comment_ID } = req.body;

        let thread = await Thread.findOne({ _id: thread_ID })
        let filteredComments = thread.comments.filter((comment) => { return String(comment._id) === String(comment_ID) })

        if(!thread) return res.status(404).json({ message: "Thread Not Found" });
        if (thread.comments.length < 1) return res.status(404).json({ message: "Comment Not Found"});
        if (filteredComments.length < 1) return res.status(404).json({ message: "Comment Not Found"});

        let operation;
        if(filteredComments[0].likes.users.includes(req.session.user_ID)) {
            await Thread.findOneAndUpdate({
                _id: thread_ID,
                "comments._id": comment_ID
            }, {
                $set: {"comments.$.likes.number": filteredComments[0].likes.number - 1},
                $pull: {"comments.$.likes.users": req.session.user_ID}
            });

          operation = "dislike"
        }else {
            await Thread.findOneAndUpdate({
                _id: thread_ID,
                "comments._id": comment_ID
            }, {
                $set: {"comments.$.likes.number": filteredComments[0].likes.number + 1},
                $addToSet: {"comments.$.likes.users": req.session.user_ID}
            });

            operation = "like"
        }
        let updatedThread = await Thread.findOne({ _id: thread_ID });
        let updatedComment = updatedThread.comments.filter((comment) => {
            return String(comment._id) === String(comment_ID)
        })

        res.status(200).json({
            operation: operation,
            comment: updatedComment[0]
        });
    } catch (err) {
        Log("An error occurred while liking a thread: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})


router.post("/post/repost", Authenticated, async (req, res, next) => {
    try {
        let { thread_ID } = req.body;

        let thread = await Thread.findOne({ _id: thread_ID })
        if(!thread) return res.status(404).json({ message: "Thread Not Found" });
        if(thread.user_ID === req.session.user_ID) return res.status(403).json({ message: "User Is The Original Poster" })

        let operation;
        if(thread.reposts.users.includes(req.session.user_ID)) {
            Thread.findOneAndDelete({ user_ID: req.session.user_ID, "reposted.original": String(thread._id) })
                .then(async deletedThread => {
                    await Thread.findOneAndUpdate({ _id: thread_ID },{ $set: { "reposts.number": thread.reposts.number - 1 }, $pull: { "reposts.users": req.session.user_ID } } );
                })
                .catch(err => {
                    Log("An error occurred while unreposting a thread: \n" + err);
                    return res.status(500).json({ message: "Internal Server Error" });
                });

            operation = "unrepost"
        }else {
            let newThread = new Thread({
                user_ID: req.session.user_ID,
                content: thread.content,
                hashtags: thread.hashtags,
                reposted: {
                    status: true,
                    original: thread._id
                }
            });
            await newThread.save();
            await Thread.findOneAndUpdate({ _id: thread_ID },{ $set: { "reposts.number": thread.reposts.number + 1 }, $addToSet: { "reposts.users": req.session.user_ID } } );

            operation = "repost"
        }
        let updatedThread = await Thread.findOne({ _id: thread_ID });
        res.status(200).json({
            operation: operation,
            thread: updatedThread
        });
    } catch (err) {
        Log("An error occurred while reposting a thread: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.post("/comment/repost", Authenticated, async (req, res, next) => {
    try {
        let { thread_ID, comment_ID } = req.body;

        let thread = await Thread.findOne({ _id: thread_ID })
        if(!thread) return res.status(404).json({ message: "Thread Not Found" });
        if(thread.user_ID === req.session.user_ID) return res.status(403).json({ message: "User Is The Original Poster" });

        let filteredComments = thread.comments.filter((comment) => { return String(comment._id) === String(comment_ID) })
        if (thread.comments.length < 1) return res.status(404).json({ message: "Comment Not Found"});
        if (filteredComments.length < 1) return res.status(404).json({ message: "Comment Not Found"});


        let operation;
        if(filteredComments[0].reposts.users.includes(req.session.user_ID)) {
            Thread.findOneAndDelete({ user_ID: req.session.user_ID, "reposted.original": String(filteredComments[0]._id) })
                .then(async deletedThread => {
                    await Thread.findOneAndUpdate({ _id: thread_ID, "comments._id": comment_ID },{ $set: { "comments.$.reposts.number": thread.reposts.number - 1 }, $pull: { "comments.$.reposts.users": req.session.user_ID } } );
                })
                .catch(err => {
                    Log("An error occurred while unreposting a thread: \n" + err);
                    return res.status(500).json({ message: "Internal Server Error" });
                });

            operation = "unrepost"
        }else {
            let newThread = new Thread({
                user_ID: req.session.user_ID,
                content: filteredComments[0].content,
                hashtags: filteredComments[0].hashtags,
                reposted: {
                    status: true,
                    original: filteredComments[0]._id
                }
            });
            await newThread.save();
            await Thread.findOneAndUpdate({ _id: thread_ID, "comments._id": comment_ID },{ $set: { "comments.$.reposts.number": thread.reposts.number + 1 }, $addToSet: { "comments.$.reposts.users": req.session.user_ID } } );

            operation = "repost"
        }
        let updatedThread = await Thread.findOne({ _id: thread_ID });
        res.status(200).json({
            operation: operation,
            thread: updatedThread
        });
    } catch (err) {
        Log("An error occurred while reposting a comment: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})


router.delete("/post/delete", Authenticated, async (req, res, next) => {
    try {
        let { thread_ID } = req.body;

        let thread = await Thread.findOne({ _id: thread_ID })
        if(!thread) return res.status(404).json({ message: "Thread Not Found" });
        if(thread.user_ID !== req.session.user_ID) return res.status(403).json({ message: "Unauthorized" });

        if(thread.reposted.status === true){
            await Thread.findOneAndUpdate({ _id: thread.reposted.original },{ $set: { "reposts.number": thread.reposts.number - 1 }, $pull: { "reposts.users": req.session.user_ID } } );
        }

        Thread.findOneAndDelete({ user_ID: req.session.user_ID, _id: thread_ID })
            .then(async deletedThread => {
                res.status(200).json({
                    thread: deletedThread
                });
            })
            .catch(err => {
                Log("An error occurred while deleting a thread: \n" + err);
                return res.status(500).json({ message: "Internal Server Error" });
            });
    } catch (err) {
        Log("An error occurred while deleting a thread: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

router.delete("/comment/delete", Authenticated, async (req, res, next) => {
    try {
        let { thread_ID, comment_ID } = req.body;

        let thread = await Thread.findOne({ _id: thread_ID })
        if(!thread) return res.status(404).json({ message: "Thread Not Found" });
        let filteredComments = thread.comments.filter((comment) => { return String(comment._id) === String(comment_ID) })
        if (thread.comments.length < 1) return res.status(404).json({ message: "Comment Not Found"});
        if (filteredComments.length < 1) return res.status(404).json({ message: "Comment Not Found"});
        if (filteredComments[0].user_ID !== req.session.user_ID) return res.status(403).json({ message: "Unauthorized" });

        Thread.findOneAndUpdate({ _id: thread_ID }, { $pull: { "comments": { _id: comment_ID, user_ID: req.session.user_ID } } } )
            .then(async deletedThread => {
                res.status(200).json({
                    thread: deletedThread
                });
            })
            .catch(err => {
                Log("An error occurred while deleting a comment: \n" + err);
                return res.status(500).json({ message: "Internal Server Error" });
            });
    } catch (err) {
        Log("An error occurred while deleting a comment: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})




// ===================================================== //
// ============= Storage Management Routes ============= //
// ===================================================== //



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