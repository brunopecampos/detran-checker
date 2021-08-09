const puppeteer = require("puppeteer");
const telegramHandler = require('./telegram_bot.js')
const jsonHandler = require('./last_recorder.js');
const { exit } = require('process');

const cpf = "02068963604";
const birthDate = "20122002";

const locationNumbers = [3, 3, 3, 5, 5, 5];
const periodNumbers = [1, 2, 3, 1, 2, 3];

main();

async function clearFields(page) {
    await page.select('select[name="local_exame"]', '')
    await page.select('select[name="turno"]', '')

}

function convertLocation(locationNum) {
    if (locationNum == 3)
        return "UAI";
    return "E E Joaquim Nabuco";
}

function convertPeriod(periodNum) {
    if (periodNum == 1)
        return "Manhã";
    else if (periodNum == 2)
        return "Tarde";
    else
        return "Noite";
}

function createAvaliableObj(location, period, date) {
    return {
        location: location,
        period: period,
        date: date
    }
}

async function schedule(locationNum, periodNum, page) {

    let location;
    let period;
    let date;
    let outputString;
    let dateObj;
    let avaliableObj;

    location = convertLocation(locationNum);
    period = convertPeriod(periodNum);

    clearFields(page)
    await page.waitForTimeout(2000);

    await page.select('select[name="local_exame"]', locationNum)
    await page.select('select[name="turno"]', periodNum)
    await page.waitForTimeout(1000)

    const datesStrings = await page.$eval('select[name="data"]', el => el.innerText);

    if (datesStrings == "não existem datas para o período selecionado") {
        outputString = "Não Tem em " + location + " em " + period;
        console.log(outputString);
        return false;
    } else {

        outputString = "Horário Encontrado!\nLocal: " + location + "\nPeríodo: " + period + "\nDatas: \n" + datesStrings;
        dateObj = datesStrings.split(/\r\n|\r|\n/);
        avaliableObj = createAvaliableObj(location, period, dateObj);

        console.log(outputString);
        return avaliableObj;
    }
}

async function sendToPhones(json, scrap) {
    let outputString = 'Horários Encontrados!\n';
    console.log("json: ");
    console.log(json);
    console.log("scrap: ");
    console.log(JSON.stringify(scrap));

    if (json == JSON.stringify(scrap)) {
        console.log("No updates from previous message.");
    }
    else {
        scrap.forEach(avaliableObj => {
            outputString = outputString + "Local: " + avaliableObj.location + "\nPeríodo: " + avaliableObj.period + "\nDatas: \n";
            avaliableObj.date.forEach(date => {
                outputString = outputString + date + '\n';
            });
        });

        await telegramHandler.sendMessages(outputString);
        await jsonHandler.writeAvaliableDatesJSON(scrap);
    }
}

async function timeToRun() {
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Brazil/East" });
    console.log(nz_date_string);
    let date_nz = new Date(nz_date_string);
    let hour = (date_nz.getHours());
    let min = (date_nz.getMinutes());
    let weekDay = (date_nz.getDay());
    console.log("Current Hour: " + hour + "\nCurrent WeekDay: "+ weekDay);

    if(hour < 18 && hour > 12 && weekDay > 0 && weekDay < 6)
        return true;
    else    {
        if(hour == 12 && min < 59 && min > 45 && weekDay > 0 && weekDay < 6) {
            console.log("Clearing JSON cloud");
            //await refreshJSON();
            await jsonHandler.writeAvaliableDatesJSON([{'defaut' : 'defaut'}]);
        }
        return false;
    }
}

async function main() {

    if(! (await timeToRun()) ) {
        console.log("Not right time to run Telegram Checker Bot");
        exit();
    }

    console.log("Initiating Telegram checker bot...");
    console.log("connecting to detran site..")

    var AvalibleObjList = [];
    var aux;
    var attempts = 1;

    const chromeOptions = {
        headless: true,
        defaultViewport: null,
        args: [
            "--no-sandbox",
            "--single-process",
            "--no-zygote"
        ],
    };
    const browser = await puppeteer.launch(chromeOptions);
    const page = await browser.newPage();
    await page.goto('https://www.detran.mg.gov.br/habilitacao/1-habilitacao-quero-ser-condutor/agendar-exame-de-legislacao');

    await page.waitForSelector('input[name="cpf"]', {
        visible: true,
    });

    console.log("Site loading sucessfull");
    //log in
    await page.focus('input[name="cpf"]')
    await page.keyboard.type(cpf);
    await page.focus('input[name="data_nascimento"]')
    await page.keyboard.type(birthDate);
    await page.click('button[class="btn-primary btn"]')

    await page.waitForSelector('select[name="local_exame"]', {
        visible: true,
    }).then( () => {
      console.log("Site login Sucessfull.")
    }
    ).catch((erro) => {
      console.log("Error in site login: " + error)
    });

    var i;
    for (i = 0; i < 6; i++) {

        await schedule(locationNumbers[i].toString(), periodNumbers[i].toString(), page).then(async (result) => {
            if (result !== false) {
                AvalibleObjList.push(result);
            }
        }).catch((err) => {
            console.log("Erro na consulta do horario " + locationNumbers[i].toString() + " " + periodNumbers[i].toString() + ":");
            console.log(err);
        });
    }
    if(AvalibleObjList.length != 0) {
        var jsonData = await jsonHandler.readAvaliableDatesJSON();
        await sendToPhones(jsonData, AvalibleObjList, telegramHandler, jsonHandler);
    } else {
        console.log('No time avalible at the moment');
    }
    exit();
}
