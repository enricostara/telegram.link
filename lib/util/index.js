//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link


// Import dependencies
var BigInteger = require('jsbn');

// Export
exports.createMessageId = createMessageId;
exports.Logger = require('./logger');

// Create a message ID starting from local time
function createMessageId() {
    var time = new BigInteger(new Date().getTime().toString());
    time = time.divide(new BigInteger(1000..toString()));
    return time.shiftLeft(32).toString();
}