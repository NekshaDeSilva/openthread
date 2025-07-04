require("dotenv").config();
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { Log } = require("../Handlers/Logger");

router.post("/upload", async (req, res, next) => {
    try{
        let { dir, name, content } = req.body;

        const secretToken = process.env.SECRET_TOKEN;
        const providedToken = req.headers["x-upload-secret"];
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress

        if (!providedToken || providedToken !== secretToken) {
            Log("Unauthorized upload attempt from IP: " + ip);
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!dir || !name || !content) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const basePath = path.join(__dirname, "..", "Storage_Container");
        const targetDir = path.join(basePath, dir);
        const filePath = path.join(targetDir, name);

        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(filePath, content);

        Log(`File uploaded successfully: ${filePath} from IP: ${ip}`);
        res.status(200).json({ message: "File uploaded successfully", filePath: process.env.URL + path.join(dir, name) });

    }catch (err){
        Log("An error occurred while uploading file: \n" + err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

module.exports = router;