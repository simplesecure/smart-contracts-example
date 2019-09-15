const ethers = require('ethers');
let url = "http://127.0.0.1:7545";
let customHttpProvider = new ethers.providers.JsonRpcProvider(url);
//testing only
const privateKey = "8192c7840f4ad34777acb0e89f7b4e1a134986f9ec09e57e6f3414dd813843f6";

module.exports = {
  sendTransaction: async function(mnemonic, contractAddress, updates, network, abi) {
    let wallet;
    let contract;
    if(network === "local") {
      console.log("local");
      wallet = new ethers.Wallet(privateKey, customHttpProvider);
    } else {
      provider = ethers.getDefaultProvider(network);
      let initwallet = new ethers.Wallet.fromMnemonic(mnemonic);
      const key = initwallet.signingKey.keyPair.privateKey;
      wallet = new ethers.Wallet(key, provider);
    }
    try {
      contract = await new ethers.Contract(contractAddress, abi, wallet);
    } catch(err) {
      return {
        success: false, 
        error: err
      }
    }

    const updateFunction = updates.functionName;
    const updateValue = updates.value;

    try {
      let updatedContract = await contract[updateFunction](updateValue);
      return {
        success: true, 
        transactionInfo: updatedContract
      }
    } catch(error) {
      return {
        success: false, 
        error
      }
    }
  }
}