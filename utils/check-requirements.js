require('dotenv').config();
const fs = require('fs');
const { HEADER } = require("./header");

const isEmpty = (object) => {
  for (let index = 0; index < object.length; index++) {
    if(Object.keys(object[index]).length > 0)
      return false
  }

  return true
}

const validParam = (object, key) => {
  if(key == "exist" && object["pageProps"].statusCode != 404)
    return true
  else if(key == "exist")
    return false

  if(object["pageProps"].project != undefined){
    if(key in object["pageProps"].project)
      if(key == "discordServerRoles")
        return isEmpty(object["pageProps"].project[key], key) ? null : object["pageProps"].project[key];

    return object["pageProps"].project[key];
  }
  
  return null;
}

const checkRequirements = async (slug) => {
  const configAlphabot = JSON.parse(fs.readFileSync(__dirname + "/files/path-alphabot.json"));
  const defaultPath = configAlphabot.path || process.env.PATH_ALPHABOT

  try {
    const response = await fetch(`https://www.alphabot.app/_next/data/${defaultPath}/en/${slug}.json`, {
      "headers": HEADER,
      "referrer": "https://www.alphabot.app/?sortDir=-1&scope=all&sortBy=newest&filters=unregistered",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    });

    const data = await response.json()
    
    console.log(`\nhttps://www.alphabot.app/${slug}`);

    const discordRequirement = validParam(data, "discordServerRoles");
    const discordServerId = validParam(data, "discordServerId");
    const questionRequirement = validParam(data, "questions");
    const ethRequirement = validParam(data, "requiredEth");
    const tokensRequirement = validParam(data, "requiredTokens");
    const followRequirement = validParam(data, "twitterFollows");
    const twitterActionRequirement = validParam(data, "twitterRetweet");
    const requireCaptcha = validParam(data, "connectCaptcha");
    const requireDiscord = validParam(data, "connectDiscord");
    const blockchain = validParam(data, "blockchain");
    const projectId = validParam(data, "dataId");
    const exist = validParam(data, "exist");

    return { 
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
    }
  } catch (error) {
    console.log(` └─ Talvez o path: ${process.env.PATH_ALPHABOT} não seja mais válido, altere para o mais recente`);
    process.exit(0)
  }
  
}

module.exports = {
  checkRequirements
}