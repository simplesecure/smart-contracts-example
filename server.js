const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const cors = require('cors')
app.use(bodyParser.json());
app.use(cors());
const port = 5000;

const ethers = require('ethers');
let provider = ethers.getDefaultProvider('ropsten');
let url = "http://127.0.0.1:7545";
let customHttpProvider = new ethers.providers.JsonRpcProvider(url);
let address = "0xe9CF9486ECf63bdA487B64698085A51392f42081";
let privateKey = "8192c7840f4ad34777acb0e89f7b4e1a134986f9ec09e57e6f3414dd813843f6"; 

app.post('/ganache/deployContract', async (req, res) => {
  const { abi, bytecode } = req.body;
  //For the local Ganache blockchain
  let wallet = new ethers.Wallet(privateKey, customHttpProvider);
  customHttpProvider.getBalance(address).then((balance) => {

    // balance is a BigNumber (in wei); format is as a sting (in ether)
    let etherString = ethers.utils.formatEther(balance);

    console.log("Balance: " + etherString);
  });
  let factory = new ethers.ContractFactory(abi, bytecode, wallet);

  // Notice we pass in "Hello World" as the parameter to the constructor
  let contract = await factory.deploy();

  // The address the Contract WILL have once mined
  // See: https://ropsten.etherscan.io/address/0x2bd9aaa2953f988153c8629926d22a6a5f69b14e
  console.log(contract.address);
  // "0x2bD9aAa2953F988153c8629926D22A6a5F69b14E"

  // The transaction that was sent to the network to deploy the Contract
  // See: https://ropsten.etherscan.io/tx/0x159b76843662a15bd67e482dcfbee55e8e44efad26c5a614245e12a00d4b1a51
  console.log(contract.deployTransaction.hash);
  // "0x159b76843662a15bd67e482dcfbee55e8e44efad26c5a614245e12a00d4b1a51"

  // The contract is NOT deployed yet; we must wait until it is mined
  await contract.deployed()
  res.send({message: "Contract deployed", address: contract.address, hash: contract.deployTransaction.hash });
});

app.post('/ropsten/deployContract', async (req, res) => {
  const { abi, bytecode } = req.body;
  let mnemonic = "day laundry wet frog census letter verify toe try biology love decrease";
  let initwallet = new ethers.Wallet.fromMnemonic(mnemonic);
  const ropPrivKey = initwallet.signingKey.keyPair.privateKey;
  let ropWallet = new ethers.Wallet(ropPrivKey, provider);
  let ropAddress = ropWallet.signingKey.address;
  
  provider.getBalance(ropAddress).then((balance) => {
  
    // balance is a BigNumber (in wei); format is as a sting (in ether)
    let etherString = ethers.utils.formatEther(balance);
  
    console.log("Balance: " + etherString);
  });
  // Create an instance of a Contract Factory
  let factory = new ethers.ContractFactory(abi, bytecode, ropWallet);

  // Notice we pass in "Hello World" as the parameter to the constructor
  let contract = await factory.deploy();

  // The address the Contract WILL have once mined
  // See: https://ropsten.etherscan.io/address/0x2bd9aaa2953f988153c8629926d22a6a5f69b14e
  console.log(contract.address);
  // "0x2bD9aAa2953F988153c8629926D22A6a5F69b14E"

  // The transaction that was sent to the network to deploy the Contract
  // See: https://ropsten.etherscan.io/tx/0x159b76843662a15bd67e482dcfbee55e8e44efad26c5a614245e12a00d4b1a51
  console.log(contract.deployTransaction.hash);
  // "0x159b76843662a15bd67e482dcfbee55e8e44efad26c5a614245e12a00d4b1a51"

  // The contract is NOT deployed yet; we must wait until it is mined
  await contract.deployed()

  // Done! The contract is deployed.
  res.send({message: "Contract deployed", address: contract.address, hash: contract.deployTransaction.hash });
});

app.post('/ganache/fetchContract', async (req, res) => {
  const { abi, contractAddress } = req.body;
  let contract = await new ethers.Contract(contractAddress, abi, customHttpProvider);
  // let tasks = await contract.tasks(1);
  res.send(contract);
});

app.post('/ropsten/fetchContract', async (req, res) => {
  const { abi, ropContractAddress } = req.body;
  let contract = new ethers.Contract(ropContractAddress, abi, provider);
  let tasks = await contract.tasks(1);
  res.send(tasks);
});

app.post('/sendTx', async (req, res) => {
  const { abi, contractAddress, updates, network } = req.body;
  let wallet;

  if(network === "local") {
    wallet = new ethers.Wallet(privateKey, customHttpProvider);
  } else if(network === "ropsten") {
    let mnemonic = "day laundry wet frog census letter verify toe try biology love decrease";
    let initwallet = new ethers.Wallet.fromMnemonic(mnemonic);
    const ropPrivKey = initwallet.signingKey.keyPair.privateKey;
    wallet = new ethers.Wallet(ropPrivKey, provider);
  }

  let contract = await new ethers.Contract(contractAddress, abi, wallet);
  const updateFunction = updates.functionName;
  const updateValue = updates.value;

  let updatedContract = await contract[updateFunction](updateValue);
  res.send(updatedContract);
});

app.post('/estimateGas', async (req, res) => {
  const { contractAddress, network } = req.body;
  let estimate;
  const tx = {
    to: contractAddress, 
    data: "0x"
  }
  if(network === "local") {
    estimate = await customHttpProvider.estimateGas(tx);
  } else if(network === "ropsten") {
    estimate = await provider.estimateGas(tx)
  }

  res.send(JSON.stringify(estimate.toNumber()));
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))



