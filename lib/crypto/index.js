//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

// Export the classes
exports.PublicKey = require('./public_key');
exports.PQFinder = require('./pq_finder');

// Export functions
exports.createSHA1Hash = createSHA1Hash;
exports.createRandomBuffer = createRandomBuffer;
exports.createNonce = createNonce;

// Import dependencies
var crypto = require('crypto');
var BigInteger = require('jsbn');


// Create SHA1 hash
function createSHA1Hash(buffer) {
    var sha1sum = crypto.createHash('sha1');
    sha1sum.update(buffer);
    return new Buffer(sha1sum.digest());
}

// Create a random Buffer
function createRandomBuffer(bytesLength) {
    return new Buffer(crypto.randomBytes(bytesLength));
}

// Create a new nonce
function createNonce(bytesLength) {
    return '0x' + createRandomBuffer(bytesLength).toString('hex');
}

// RSA encrypt function, param: { key: publicKey, message: messageToBeEncrypted }
function  rsaEncrypt (param) {


}

//            var seed = this._createRandomBuffer(255 - hash.length - pqInnerData.length);
