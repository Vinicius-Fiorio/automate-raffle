const fs = require('fs');
const { HEADER } = require("./header");

const requestRaffles = async (sort, scope, size, page, filter) => {
  const url = `https://www.alphabot.app/api/projects?sort=${sort}&scope=${scope}&showHidden=false&pageSize=${size}&pageNum=${page}&search=&filter=${filter}`;

  const response = await fetch(url, {
    "headers": HEADER,
    "referrer": "https://www.alphabot.app/?sortDir=-1&filters=unregistered&scope=community&sortBy=startDate",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
  });

  try {
    const data = await response.json();

    return data
  } catch (error) {
    console.log(error)
  }
  
  process.exit(1)
}

let stop = false;
let i = 0;
async function getRaffles(scope="community", size=16){

  fs.writeFile(`${__dirname}/files/raffles.json`, '[]', (err) => {
    if (err) throw err;
    console.log(`Buscando Raffles: ${scope}`);
  });

  while (!stop) {
    const raffles = await requestRaffles("newest", scope, size, i, "unregistered");
    let rawText = fs.readFileSync(`${__dirname}/files/raffles.json`);
    let allRaffles = JSON.parse(rawText);
    
    raffles.forEach(raffle => {
      if(scope != "community" && !raffle.reqString.includes('d') && !raffle.requirePremium){
        allRaffles.push(raffle)
      }else if(scope == "community"){
        allRaffles.push(raffle)
      }
    });
  
    fs.writeFile(`${__dirname}/files/raffles.json`, JSON.stringify(allRaffles, null, 2), (err) => {
      if (err) throw err;
      console.log('Busca atualizada, totalizando' + ` ${allRaffles.length} raffles não feitos`);
    });
  
    if(raffles.length < size)
      stop = true;
  
    i++;
  }

  return fs.readFileSync(`${__dirname}/files/raffles.json`);
}

module.exports = {
  getRaffles
}