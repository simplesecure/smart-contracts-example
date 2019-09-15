const ethers = require('ethers');
const infuraKey = "b8c67a1f996e4d5493d5ba3ae3abfb03";
const Web3 = require('web3');
module.exports = {
  signTransaction: async function(mnemonic, tx, network) {
    //This is where we will use the mnemonic to get the private key
    const provider = new Web3.providers.HttpProvider(network === "local" ? 'http://localhost:7545' : `https://${network}.infura.io/v3/${infuraKey}`);
    var web3 = new Web3(provider);
    let privateKey;
    if(network === "local") {
      privateKey = "8192c7840f4ad34777acb0e89f7b4e1a134986f9ec09e57e6f3414dd813843f6";
    } else {
      let wallet = new ethers.Wallet.fromMnemonic(mnemonic);
      privateKey = wallet.signingKey.keyPair.privateKey;
    }
    web3.eth.accounts.signTransaction(tx, privateKey, async (err, signedTx) => {
      if(err) {
        //handle it
        console.log(error)
      } else {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
          .on('confirmation', function(number) {
            console.log(number);
          })
      }
    });
  }
}