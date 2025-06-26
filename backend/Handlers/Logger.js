const fs = require('fs');
const path = require('path');
const logsDir = path.join(__dirname, '../Logs');

function Init() {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }
    const logEntry = `[${new Date().toISOString().slice(0, 19)}]: Backend Started\n`;
    const date = new Date();
    const IsoString = date.toISOString();
    const dateStr = IsoString.slice(0, 10) + "_" + IsoString.slice(11,13) + "-" + IsoString.slice(14,16) + "-" + IsoString.slice(17,19);
    const logFilePath = path.join(logsDir, `${dateStr}.log`);
    fs.appendFileSync(logFilePath, logEntry, { flag: 'a' });
}

function Log(message) {
    const SortedLogFileList = fs.readdirSync(logsDir)
        .map(fileName => {
            const filePath = path.join(logsDir, fileName);
            return { name: fileName, stats: fs.statSync(filePath) };
        })
        .filter(file => file.stats.isFile())
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
    const LatestLogFile = SortedLogFileList.length > 0 ? SortedLogFileList[0] : null;
    const lines = message.split('\n');
    const logEntry = lines.map(line => `[${new Date().toISOString().slice(0, 19)}]: ${line}`).join('\n') + '\n';
    const logFilePath = path.join(logsDir, LatestLogFile.name);
    fs.appendFileSync(logFilePath, logEntry, { flag: 'a' });
}

module.exports = { Init, Log };