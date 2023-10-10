const { getBalance } = require("./balance-address");

const getFromBalanceRequired = async (wallets, balanceRequired, chain) => {
  if(chain == "ETH"){
    let i = 0;
    let hasBalanceWallets = new Array();

    while(i < wallets.length){
      const balance = await getBalance(wallets[i], chain);

      if(balance >= balanceRequired)
        hasBalanceWallets.push(wallets[i])

      i++;
    }

    return hasBalanceWallets.length > 0 ? hasBalanceWallets : null;
  }
  
  return wallets
}

module.exports = {
  getFromBalanceRequired
}