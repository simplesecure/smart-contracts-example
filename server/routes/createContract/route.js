const express = require('express');
const router = express.Router();
const { handleContract } = require('./handler');
const { fetchUser } = require('../../sharedHelpers');

router.post('/', async function(req, res, next) {
  const { abi, bytecode, username, password, devId, development, network } = req.body;
  const { authorization } = req.headers;
  const mnemonic = await fetchUser(username, password, devId, development, authorization);
  const contractDeployment = await handleContract(mnemonic, abi, bytecode, network);
  res.send(contractDeployment);
});

module.exports = router;