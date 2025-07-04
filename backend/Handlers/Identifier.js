const fs = require('fs');
const path = require('path');
const idsFile = path.join(__dirname, 'usedIds.json');
let usedIds = new Set();

function ID(prefix) {
    const characters = '0123456789';
    let result = '';
    for (let i = 0; i < 15; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    result = prefix + result;
    return result;
}

function saveIds() {
    fs.writeFileSync(idsFile, JSON.stringify([...usedIds]), 'utf-8');
}

function generateUniqueID(prefix = 'u') {
    if (fs.existsSync(idsFile)) {
        const data = fs.readFileSync(idsFile, 'utf-8');
        usedIds = new Set(JSON.parse(data));
    }

    let id;
    do {
        id = ID(prefix);
    } while (usedIds.has(id));
    usedIds.add(id);
    saveIds();
    return id;
}

module.exports = generateUniqueID;