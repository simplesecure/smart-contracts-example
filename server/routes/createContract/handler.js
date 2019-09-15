const ethers = require('ethers');
let url = "http://127.0.0.1:7545";
let customHttpProvider = new ethers.providers.JsonRpcProvider(url);
//testing only
const privateKey = "8192c7840f4ad34777acb0e89f7b4e1a134986f9ec09e57e6f3414dd813843f6";
module.exports = {
  handleContract: async function(mnemonic, abi, bytecode, network) {
    let wallet;
    let contract;
    if(network === "local") {
      wallet = new ethers.Wallet(privateKey, customHttpProvider);
    } else {
      provider = ethers.getDefaultProvider(network);
      let initwallet = new ethers.Wallet.fromMnemonic(mnemonic);
      const key = initwallet.signingKey.keyPair.privateKey;
      wallet = new ethers.Wallet(key, provider);
    }
    // Create an instance of a Contract Factory
    let factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
    // Notice we pass in "Hello World" as the parameter to the constructor
    try {
      contract = await factory.deploy();
      console.log(contract.address);
      console.log(contract.deployTransaction.hash);
    } catch(err) {
      return {
        success: false,
        error: `[1] - ${err}`
      }
    }

    try {
      await contract.deployed();
      return {
        success: true,
        address: contract.address, 
        transaction: contract.deployTransaction.hash
      }
    } catch(error) {
      return {
        success: false, 
        error: `[2] - ${error}`
      }
    }
  }
}