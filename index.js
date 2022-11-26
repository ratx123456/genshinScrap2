const puppeteer = require("puppeteer");
const { Expo } = require('expo-server-sdk')
const express = require("express");
const { db } = require("./firebase/firebase");
const {tableParser} = require("puppeteer-table-parser")
const app = express();
const port = process.env.PORT || 8080;
//https://genshin-impact.fandom.com/wiki/Promotional_Codes
const urls = [
  "https://genshin-impact.fandom.com/wiki/Promotional_Codes"
];

let expo = new Expo();


let somePushTokens=['ExponentPushToken[nuoSJPPCIIiKB3gJtt55be]']

async function sendMessage(codesFromWeb) {
  let messages = [];
  let CodesFromdb;
  //let CodesFromdb = ["ExponentPushToken[ssQHGSPskTYprNdjT81oqg]"];
  await db
    .collection("expo")
    .get()
    .then((doc) => {
      CodesFromdb = doc.docs.map((x) => x.data().codes);
    });

    

  for (let pushToken of CodesFromdb) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
   // console.log('pushToken',pushToken); 
  
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }
  
    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)

    
    messages.push({
      to: pushToken,
      sound: 'default',
      body: 'NEW GENSHIN IMPACT CODES',
      priority: 'high'
    //  data: { withSome: 'data' },
    })
  }

  let chunks = expo.chunkPushNotifications(messages);
let tickets = [];
(async () => {
  // Send the chunks to the Expo push notification service. There are
  // different strategies you could use. A simple one is to send one chunk at a
  // time, which nicely spreads the load out over time:
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      //console.log(ticketChunk);
      tickets.push(...ticketChunk);
      // NOTE: If a ticket contains an error code in ticket.details.error, you
      // must handle it appropriately. The error codes are listed in the Expo
      // documentation:
      // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
    } catch (error) {
      console.error(error);
    }
  }
})();
  
}

async function fillDbWithCodes (codesFromWeb) {

  try {

    codesFromWeb.forEach(async (element) => {
      await db.collection("codes").doc(element.toString()).set({
        codes: element,
      });
    });
    
  } catch (error) {

    console.log('error in fillDbWithCodes',error);
    
  }

}

async function deleteDb (codesFromDb) {

  try {
    codesFromDb.forEach(async (element) => {
      await db.collection("codes").doc(element).delete()
    });
  } catch (error) {
    console.log('error in deleteDb',error);
  }
  
}


function areEqual(array1, array2) {
  if (array1.length === array2.length) {
    return array1.every(element => {
      if (array2.includes(element)) {
        return true;
      }

      return false;
    });
  }

  return false;
}

//TODO: quitar el code quemado

const getCodesFromdb = async (codesFromWeb) => {


  let CodesFromdb
  
  try {

    await db.collection("codes")
    .get()
    .then((doc) => {
      CodesFromdb = doc.docs.map((x) => x.data().codes);
    });
   

   //sendMessage(codesFromWeb)


  if (CodesFromdb.length < codesFromWeb.length) {
    console.log('db menor que web');  
    deleteDb(CodesFromdb)    
    fillDbWithCodes(codesFromWeb)
    console.log('notifi');
    sendMessage(codesFromWeb)
   
  }else if(CodesFromdb.length > codesFromWeb.length){
    deleteDb(CodesFromdb)    
    console.log('borrado');    
    fillDbWithCodes(codesFromWeb)

  }else if(CodesFromdb.length === codesFromWeb.length){

    if (areEqual(CodesFromdb, codesFromWeb)) {
      console.log('mismos codigos')
      //sendMessage(codesFromWeb)
    }else{
      deleteDb(CodesFromdb)  
     console.log('misma longitud pero diferente contenido')
     fillDbWithCodes(codesFromWeb)
     console.log('notifi');
     sendMessage(codesFromWeb)

    }
  


  }
    
  } catch (error) {
    console.log('error in getCodesFromdb',error);
  }
  
 
};


const funt = async () => {
  let codesFromWeb;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  let page = await browser.newPage();

  await page.setDefaultNavigationTimeout(0);


  try {
    


    for (let index = 0; index < urls.length; index++) {
      let status = await page.goto(urls[index],{
        waitUntil: 'networkidle2',
      });
      status = status.status();
      console.log('status: ' + status)
     
      const result = await tableParser(page, {
        selector: 'table',
        colParser: (value) => {
          return value.trim();
        },
        allowedColNames: {
          'Code': 'code',   
          'Duration' :'duration'
        },
        rowValidator: (row, getColumnIndex) => {
         
          if (row[1].includes('Expired')) {            
          }else{
            return row
          }      
        },
        asArray:true
        
      });

      let codesArray = []

      result.forEach((code,index)=>{
        if (index !== 0) {
          let cleanResult = code.split(";")[0]
          codesArray.push(cleanResult)
  
          
        }
     
      })


      
      getCodesFromdb(codesArray);   


    }
    await browser.close();
  } catch (error) {
    console.log("errorr ", error);
    await browser.close();
  }

 
};

 app.get('/', (req, res) => {
    res.send('Hello World!')
    funt();
  })

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
