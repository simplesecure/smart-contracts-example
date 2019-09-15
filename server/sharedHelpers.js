module.exports = {
  fetchUser: function(username, password, devId, development, authorization) {
    //This is hard-coded until we connect it to the db
    //TODO verify API Key, devId, fetch user from right environment, decrypt mnemonic
    return new Promise(function(resolve, reject) {
      let mnemonic = "day laundry wet frog census letter verify toe try biology love decrease";
      resolve(mnemonic)
    });
  }
}