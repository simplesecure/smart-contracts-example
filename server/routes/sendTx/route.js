const express = require('express');
const router = express.Router();
const { sendTransaction } = require('./handler');
const { fetchUser } = require('../../sharedHelpers');

router.post('/', async function(req, res, next) {
  const { username, password, devId, development, contractAddress, updates, network, abi } = req.body;
  const { authorization } = req.headers;
  const mnemonic = await fetchUser(username, password, devId, development, authorization);
  const sendTx = await sendTransaction(mnemonic, contractAddress, updates, network, abi);
  res.send(sendTx);
});
  
module.exports = router;