const ethers = require("ethers");
const { providers } = require("./providers");

const getBalance = async (address, chain) => {
  const provider = new ethers.JsonRpcProvider(providers[chain]);
  const balance = await provider.getBalance(address);

  return ethers.formatEther(balance);
}

module.exports = {
  getBalance
}