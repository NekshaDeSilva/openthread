const { Init, Log } = require("./Handlers/Logger");
Init();
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo")

mongoose.connect(process.env.MONGO_URI, { useUnifiedTopology: true, useNewUrlParser: true,})
    .then(() => {
        console.log("Connected to MongoDB")
        Log("Successfully Connected to MongoDB");
    }).catch(err => {
        console.error("An error occurred while connecting to MongoDB, Please check logs for more details.");
        Log("An error occurred while connecting to MongoDB: \n" + err);
        process.exit(1);
    });
app.use(
    session({
        secret: "LHDIDH$#%@$^#$^oq$#@%FSDFDSF@$ihvVSFIVHISHI41$#@^#%&#$$@#$JBVVLJSV",
        resave: true,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
        }),
        cookie: {
            maxAge: 1 * 24 * 60 * 60 * 1000
        }
    })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const index = require("./Routes/Index")
app.use("/", index);

app.use((req, res, next) => {
    res.json({"404": "Not Found"})
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Express Backend is running on port " + (process.env.PORT || 3000));
    Log("Express Backend is running on port " + (process.env.PORT || 3000))
});