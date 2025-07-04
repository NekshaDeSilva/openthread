const { Init, Log } = require("./Handlers/Logger");
Init();
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo")
const path = require("path");
const helmet = require("helmet");

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB")
        Log("Successfully Connected to MongoDB");
    }).catch(err => {
        console.error("An error occurred while connecting to MongoDB, Please check logs for more details.");
        Log("An error occurred while connecting to MongoDB: \n"
            + "=========================Start Of Error=========================\n"
            + err
            + "\n=========================End Of Error=========================");
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
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "Views"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/Views"));

const index = require("./Routes/Index")
const api = require("./Routes/Api")
app.use("/", index);
app.use("/api", api);

app.use((req, res, next) => {
    res.status(404).json({"404": "Not Found"})
});

app.use((err, req, res, next) => {
    console.log("An Error Occurred in Express/EJS. Please check logs for more details.");
    Log("Express/EJS Error: \n"
        + "=========================Start Of Error=========================\n"
        + err
        + "\n=========================End Of Error=========================");
    res.status(500).json({"500": "Internal Server Error"});
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Express Backend is running on port " + (process.env.PORT || 3000));
    Log("Express Backend is running on port " + (process.env.PORT || 3000))
});