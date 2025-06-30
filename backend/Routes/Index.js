require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Log } = require("../Handlers/Logger");
const bcrypt = require("bcrypt");

const User = require("../Models/User");

router.get("/", async (req, res, next) => {
    res.render("index")
})

module.exports = router;