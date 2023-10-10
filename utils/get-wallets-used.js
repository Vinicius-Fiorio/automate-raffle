const { HEADER } = require("./header");

const getWallets = async (projectId) => {
  let wallets = [];

  const response = await fetch(`https://www.alphabot.app/api/projectData/${projectId}/raffles`, {
    "headers": HEADER,
    "referrer": "https://www.alphabot.app/?sortDir=-1&scope=all&sortBy=newest&filters=unregistered",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
  });

  const projects = await response.json();

  try {
    projects.forEach(project => {

      if('mintAddress' in project && !wallets.includes(project.mintAddress)){
        wallets.push(project.mintAddress)
      }
    });

  } catch (error) {
    wallets = [];
  }

  return wallets;
}

module.exports = {
  getWallets
}