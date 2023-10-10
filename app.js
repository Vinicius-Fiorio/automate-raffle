require('dotenv').config();
const fs = require('fs');
const puppeteer = require("puppeteer");

const { getRaffles } = require("./utils/get-raffles");
const { checkRequirements } = require("./utils/check-requirements");
const { register } = require("./utils/register");
const { getWallets } = require("./utils/get-wallets-used");
const { getFromBalanceRequired } = require("./utils/get-from-balance");
const { DISCORD_SERVER_ID_AND_ROLES } = require("./discord-roles");
const { ADDRESS_USER_HOLD } = require("./addresses-hold");

const OPTION_FILTER = process.argv[2];
const OPTION_PREMIUM = process.argv[3]; // -premium=extra -premium=skip

const removeEmptySlot = (array) => {
  if(array.length == 1 && array[0] == "")
    return [];

  return array;
}

const wallets = {
  "ETH": removeEmptySlot(process.env.WALLET_ETHEREUM.split(",")),
  "SOL": removeEmptySlot(process.env.WALLET_SOLANA.split(",")),
  "BTC": removeEmptySlot(process.env.WALLET_BITCOIN.split(",")),
  "MATIC": removeEmptySlot(process.env.WALLET_ETHEREUM.split(",")),
  "AVAX": removeEmptySlot(process.env.WALLET_ETHEREUM.split(",")),
  "SUI": removeEmptySlot(process.env.WALLET_SUI.split(",")),
  "SEI": removeEmptySlot(process.env.WALLET_SEI.split(",")),
  "INJ": removeEmptySlot(process.env.WALLET_INJECTIVE.split(",")),
  "ADA": removeEmptySlot(process.env.WALLET_CARDANO.split(",")),
  "XRP": removeEmptySlot(process.env.WALLET_RIPPLE.split(",")),
  "CRO": removeEmptySlot(process.env.WALLET_ETHEREUM.split(",")),
  "APT": removeEmptySlot(process.env.WALLET_APTOS.split(",")),
  "BSC": removeEmptySlot(process.env.WALLET_ETHEREUM.split(",")),
  "LYXe": removeEmptySlot(process.env.WALLET_ETHEREUM.split(",")),
  "VENOM": removeEmptySlot(process.env.WALLET_VENOM.split(",")),
  "EGLD": removeEmptySlot(process.env.WALLET_MULTIVERSX.split(",")),
}

let successfulRaffles = 0;
let applicationRaffles = 0;
let discordRaffles = 0;
let limitRaffles = 0;
let notSetupWallet = 0;
let noAnswerRaffles = 0;
let notHolder = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginTwitter(page){
  try {
    await page.goto('https://twitter.com/i/flow/login',{waitUntil: "networkidle0"});

    const inputUsername = await page.waitForXPath('//*[@id="layers"]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[5]/label/div/div[2]/div/input');
    await inputUsername.click();
    await inputUsername.type(process.env.USERNAME_TWITTER)

    await page.keyboard.press('Enter');
    await sleep(1510);

    await page.keyboard.type(process.env.PASSWORD_TWITTER);
    await sleep(1600);

    await page.keyboard.press('Enter');

    await page.waitForXPath('/html/body/div[1]/div/div/div[2]/header/div/div/div/div[2]/div/div/div[2]/div/div[2]/div/div/div/span');
    const userElement = await page.$x('/html/body/div[1]/div/div/div[2]/header/div/div/div/div[2]/div/div/div[2]/div/div[2]/div/div/div/span');
    
    const user = await page.evaluate(span => span.textContent, userElement[0]);

    if(user.replace("@","") == process.env.USERNAME_TWITTER)
      return true;

    return false
  } catch (error) {
    return false
  }
}

async function followAccount(browser, url){
  const page = await browser.newPage()

  try {
    await page.goto(url);

    await sleep(6000);

    await page.keyboard.press("Enter")

    await sleep(2000);
    await page.close();
    return true;

  } catch (error) {
    await page.close();
    return false
  }
}

async function likeRetweet(browser, url){
  const page = await browser.newPage()
  let urlSplited = url.split("/");
  const tweetID = urlSplited[urlSplited.length - 1];

  try {
    await page.goto(`https://twitter.com/intent/retweet?tweet_id=${tweetID}`);

    await sleep(8000);
    await page.keyboard.press('Enter');
    await sleep(2000);

    await page.goto(`https://twitter.com/intent/like?tweet_id=${tweetID}`);

    await sleep(8000);
    await page.keyboard.press('Enter');
    await sleep(1000);

    await page.close();

    return true;
  } catch (error) {
    await page.close();
    return false;
  }
}

async function chooseWallet(projectId, wallets){
  const allUsed = await getWallets(projectId);

  let selectedWallet = "";

  for (let index = 0; index < wallets.length; index++) {
    const wallet = wallets[index];

    if(!allUsed.includes(wallet)){
      selectedWallet = wallet;
      break;
    }
  }

  if(selectedWallet == ""){
    return wallets[Math.floor(Math.random() * wallets.length)]
  }

  return selectedWallet;
}

function hasTokens(tokensList){

  for (let index = 0; index < tokensList.length; index++) {
    contractToken = tokensList[index].address
    if(contractToken != "" && !ADDRESS_USER_HOLD.includes(contractToken))
      return false
  }

  return true;
}

async function completeRaffle(browser, raffle){
  try {
    const {
      exist,
      discordRequirement, 
      discordServerId,
      questionRequirement, 
      ethRequirement, 
      tokensRequirement, 
      followRequirement, 
      twitterActionRequirement,
      requireCaptcha,
      requireDiscord,
      blockchain,
      projectId
    } = await checkRequirements(raffle.slug);

    
    if(!hasTokens(tokensRequirement))
      return {code: 405}

    if(questionRequirement != undefined && questionRequirement.length > 0 )
      return {code: 403}
    
    if(exist && blockchain in wallets && wallets[blockchain].length > 0){
      const hasInvite = discordRequirement != null;
      const elegibleWallets = await getFromBalanceRequired(wallets[blockchain], ethRequirement, blockchain);
      
      if(elegibleWallets == null)
        return { code: 2, amount: ethRequirement}

      const walletAddress = await chooseWallet(projectId, elegibleWallets);

      const isInvalid = () => {
        if(requireCaptcha)
          return { status: true, reason: "captcha" }

        if(hasInvite && requireDiscord){
          let hasRoles = new Array();

          for (let index = 0; index < discordRequirement.length; index++) {
            const discord = discordRequirement[index];
            hasRoles[index] = 0;

            if("roles" in discord && discord.id in DISCORD_SERVER_ID_AND_ROLES){
              discord["roles"].forEach(role => {
                if(DISCORD_SERVER_ID_AND_ROLES[discord.id].includes(role.roleId)){
                  hasRoles[index] += 1;
                }
              });
            }else if(discord.id in DISCORD_SERVER_ID_AND_ROLES){
              hasRoles[index] += 1;
            }
          }

          if(hasRoles.includes(0)){
            return { status: true, reason: "not has specif role or server" }
          }
        }

        return { status: false }
      }

      const invalid = isInvalid();
      if(invalid.status){
        const text = `\nhttps://www.alphabot.app/${raffle.slug}`
    
        fs.appendFile('need-manual.txt', text, function (err) {
          if (err) throw err;
        });
        
        return { code: 0, reason: invalid.reason };
      }else{
        if(OPTION_PREMIUM == "-premium=extra" || OPTION_PREMIUM == undefined){
          try {
            let i = 0;
            while (i < followRequirement.length) {
              let rawAccounts = fs.readFileSync(__dirname + "/utils/files/followed-accounts.json");
              let twitterAccounts = JSON.parse(rawAccounts);
              const userTwitter = followRequirement[i].name.toLowerCase();
  
              if(!Object.keys(twitterAccounts).some(key => key == userTwitter)){
                const followed = await followAccount(browser, `https://twitter.com/intent/user?screen_name=${userTwitter}`);
  
                if(followed){
                  twitterAccounts[userTwitter] = true;
  
                  try {
                    fs.writeFileSync(`${__dirname}/utils/files/followed-accounts.json`, JSON.stringify(twitterAccounts, null, 2))
                  } catch (error) {
                    console.log("Erro ao escrever @ no arquivo", error);
                  }
                }
              }
              i++;
            }
          } catch (error) {
            console.log("Erro ao seguir conta(navegador automatizado perdeu a conexao com a aba)")
          }
      
          try {
            if(twitterActionRequirement){
              await likeRetweet(browser, twitterActionRequirement);
            }
      
            return { code: 200, wallet: walletAddress };
          } catch (error) {
            console.log("Erro ao retweetar post(navegador automatizado perdeu a conexao com a aba)");
            return {code: 0};
          }
        }else if(OPTION_PREMIUM == "-premium=skip"){
          return { code: 200, wallet: walletAddress }
        }
      }
    }else if(exist){
      if(wallets[blockchain].length == 0)
        return {code: 1, blockchain}
    }else if(!exist){
      return {code: 404}
    }

  } catch (error) {
    console.log("Não foi possivel checkar os requisitos do sorteio")
  }

  return {code: 0};
}

async function main() {
  if(OPTION_PREMIUM == "-premium=extra" || OPTION_PREMIUM == "-premium=skip"){
    console.log("É necessário possuir o premium para essas funções, caso contrário os registros nos sorteios irá falhar...")
  }

  if(OPTION_FILTER == "community" || OPTION_FILTER == undefined)
    await getRaffles();

  else if (OPTION_FILTER == "all"){
    console.log("\x1b[41mAVISO:\x1b[40m: Dependendo da quantidade de sorteios, o próprio alphabot começa a colocar captcha em todos os sorteios. Caso isso aconteça faça alguns raffles manualmente até perceber que o captcha sumiu e execute o programa novamente\n")
    await getRaffles("all", 30);

  }else{
    console.log("Argumento Inválido! Utilize um dos valores abaixo:");

    return console.table({"Minhas comunidades": "community | (vazio)","Todas comunidades": "all"})
  }
 
  fs.writeFileSync('need-manual.txt', "");

  let browser;
  let page;
  // if(OPTION_PREMIUM == "-premium=extra" || OPTION_PREMIUM == undefined){
    browser = await puppeteer.launch({
      headless: false, 
      defaultViewport: null, 
      args: [`--window-size=1510,780`],
    });

    pathPage = await browser.newPage()
    await pathPage.setRequestInterception(true);

    pathPage.on('request', interceptedRequest => {
      if (interceptedRequest.url().endsWith("_ssgManifest.js")){
        const path = interceptedRequest.url().replace("https://www.alphabot.app/_next/static/", "").replace("/_ssgManifest.js", "")
        console.log("Path Encontrado: ", path)

        fs.writeFile(`${__dirname}/utils/files/path-alphabot.json`, JSON.stringify({ path: path }, null, 2), (err) => {
          if (err) throw err;
        });
      }
      interceptedRequest.continue();
      
    });
    
    await pathPage.goto('https://www.alphabot.app/');
    await pathPage.close();

    if(OPTION_PREMIUM == "-premium=extra" || OPTION_PREMIUM == undefined){
      page = await browser.pages()

      let loginSuccess = false;
      let attemps = 0;

      while(!loginSuccess){
        loginSuccess = await loginTwitter(page[0]);
        attemps++;

        if(attemps == 2 && !loginSuccess)
          throw Error("Nao foi possivel logar na conta");
      }
    }else{
      await browser.close()
    }
  // }

  await sleep(500);
  let rawRaffles = fs.readFileSync(__dirname + "/utils/files/raffles.json");
  const raffles = JSON.parse(rawRaffles);

  let i = 0;
  let captchaCount = 0;
  while (i < raffles.length) {
    const status = await completeRaffle(browser, raffles[i]);
    
    await sleep(800);
    if(status.code == 200){
      let registered = false;
      let attempsRegister = 0;

      while (!registered) {
        const response = await register(raffles[i].slug, status.wallet, OPTION_PREMIUM == "-premium=extra" ? true : false);

        if(response.success){
          registered = true;
          successfulRaffles += 1;
        }

        if(response.reason == 'you_already_entered'){
          registered = true;
          successfulRaffles += 1;
          console.log(` └─ Já está registrado nesse raffle`)
        }

        if(response.reason == 'subscription_lapsed_entry'){
          registered = true;
          limitRaffles++;
          console.log(' └─ Sorteio atingiu a entrada máxima')
        }
          
        if(attempsRegister == 4){
          noAnswerRaffles++
          console.log(" └─ Alphabot não atualizou. Execute o programa novamente quando acabar ou tente manualmente");
          break;
        }
          
        await sleep(5000);
        attempsRegister++;
      }

    }else if(status.code == 1){
      notSetupWallet++;
      console.log(` └─ Não tem wallet ${status.blockchain} configurada`);
    }else if(status.code == 2){
      console.log(` └─ Nenhuma wallet configurada possui fundos suficientes: ${status.amount}`);
    }else if(status.code == 405){
      console.log(" └─ Não é holder de NFT");
      notHolder++;
    } else if(status.reason == "captcha"){
      console.log(" └─ Necessário realizar manualmente: CAPTCHA");
      captchaCount++;

      if(captchaCount >= 4){
        console.log("\n🤖❌ Alphabot colocou captcha em todos os raffles ❌🤖");
        console.log(" └─ Faça alguns sorteios(~2) manualmente e execute o programa novamente");
        process.exit(1)
      }
    }else if(status.code == 404){
      console.log(" └─ Sorteio não existe mais")
    }else if(status.code == 403){
      applicationRaffles++;
      console.log(" └─ Necessário realizar manualmente: APPLICATION QUESTIONS");
    }
    else{
      discordRaffles++;
      console.log(" └─ Necessário realizar manualmente: NOT HAS SPECIFIC ROLE OR SERVER");
    }

    i++;
  }

  if(OPTION_PREMIUM == "-premium=extra" || OPTION_PREMIUM == undefined){
    await browser.close();
  }

  console.table({
    "🎉 Realizados": successfulRaffles,
    "📝 Forms": applicationRaffles,
    "💎 Token": notHolder,
    "🌌 Discord": discordRaffles,
    "💯 Limite": limitRaffles,
    "👛 Wallet": notSetupWallet,
    "⏰ Demorou": noAnswerRaffles
  })

  console.log("Total: ", (successfulRaffles + applicationRaffles + discordRaffles + limitRaffles + notSetupWallet + noAnswerRaffles))
}

main();
