"use strict";
const fs = require('fs');

const Telegraf = require('telegraf');
const app = new Telegraf('1135784443:AAHqSUQUWDe534a9QoRu-5DkBYeM_kRPD1M');

async function sendMessages (message) {
    var read = fs.readFileSync('chat_ids.txt', 'utf-8');
    var idList = read.split(/\r\n|\r|\n/);
    idList.forEach( async (item) => {
        await app.telegram.sendMessage(item, message).then(() => {
            console.log("Message sent to "+ item);
        }).catch((erro) => {
            console.log("Error in send telegram message to " + item);
        });
    })
}

async function main() {
    sendMessages("aa");
}
//main();
module.exports = { sendMessages};