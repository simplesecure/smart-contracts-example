const express = require('express');
const router = express.Router();
const { signTransaction } = require('./handler');
const { fetchUser } = require('../../sharedHelpers');

router.post('/', async function(req, res, next) {
  const { username, password, devId, development, tx, network } = req.body;
  const { authorization } = req.headers;
  const mnemonic = await fetchUser(username, password, devId, development, authorization);
  const signedTx = await signTransaction(mnemonic, tx, network);
  res.send(signedTx);
});
  
module.exports = router;