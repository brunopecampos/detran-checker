"use strict";
const axios = require('axios');
const { get } = require('https');

const JSON_SERVER_KEY = '$2b$10$Cd/akIOZAWReImEjwEb68OvyI5a/LDWBmfEdvAFK0yswCzE65x/bC';
const JSON_SERVER_URL = "https://api.jsonbin.io/b/6051d6c6683e7e079c529f08";

async function writeAvaliableDatesJSON(avaliableList) {

    const headers = {
        'secret-key': JSON_SERVER_KEY,
        'Content-Type': 'application/json'
    };
    await axios.put(JSON_SERVER_URL, avaliableList, {headers})
    .then((res) => {
        console.log("Sucessfully written data in JSON cloud")
    })
    .catch ( (error) => {
        console.log("Error writing in JSON cloud: " + error);
    });
}

async function readAvaliableDatesJSON() {

    var res = await axios.get(JSON_SERVER_URL+'/latest', {
        headers: {
            'secret-key': JSON_SERVER_KEY
        }
    }).catch ( (error) => {
        console.log("error reading in cloud: " + error);
    });

    console.log("Sucessfully read from JSON cloud.");
    return JSON.stringify(res.data);
}

async function main() {
    await readAvaliableDatesJSON()
    //await writeAvaliableDatesJSON([{"teste2": "dougras"}]);
}

module.exports = { readAvaliableDatesJSON, writeAvaliableDatesJSON };
