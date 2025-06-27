const { Init, Log } = require("./Handlers/Logger");
Init();
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const helmet = require("helmet");

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const index = require("./Routes/Index")
app.use("/storage", index);

app.use((req, res, next) => {
    res.json({"404": "Not Found"})
});

app.listen(process.env.PORT || 4000, () => {
    console.log("Storage Container is running on port " + (process.env.PORT || 4000));
    Log("Storage Container is running on port " + (process.env.PORT || 4000))
});