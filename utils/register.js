require('dotenv').config();
const { HEADER } = require("./header");

const register = async (slug, mintAddress="0xfc36dB952de0156aD45a9C6654CAB1ba07daDec2", extra=false, pw="", captcha="", applicationCode="", answers=[]) => {
  let bodyJson = {
    slug: slug,
    pw: pw,
    captcha: captcha,
    mintAddress: mintAddress,
    discordId: process.env.DISCORD_ID,
    twitterId: process.env.TWITTER_ID,
    answers: answers,
    applicationCode: applicationCode
  }

  if(extra)
    bodyJson["extraEntry"] = true;

  try {
    const response = await fetch("https://www.alphabot.app/api/register", {
      "headers": HEADER,
      "referrer": `https://www.alphabot.app/${slug}`,
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": JSON.stringify(bodyJson),
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    });

    const data = await response.json()
    console.log(data.success ? ` └─ ${JSON.stringify(data)} ⊱ ${mintAddress}` : " ├─ Registro pendente, tentando novamente em 5s...");
    
    return data;
  } catch (error) {
    return {success: false, reason: "error"}
  }
}

module.exports = {
  register
}