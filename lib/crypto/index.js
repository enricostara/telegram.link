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
exports.rsaEncrypt = rsaEncrypt;

// Import dependencies
var crypto = require('crypto');
var util = require('util');
var BigInteger = require('jsbn');

// Create SHA1 hash starting from a buffer or an array of buffers
function createSHA1Hash(buffer) {
    var logger = require('../util/logger')('crypto.createSHA1Hash');
    var sha1sum = crypto.createHash('sha1');
    if (util.isArray(buffer)) {
        if (logger.isDebugEnabled()) logger.debug('It\'s an Array of buffers');
        for (var i = 0; i < buffer.length; i++) {
            sha1sum.update(buffer[i]);
        }
    } else {
        if (logger.isDebugEnabled()) logger.debug('It\'s only one buffer');
        sha1sum.update(buffer);
    }
    return sha1sum.digest();
}

// Create a random Buffer
function createRandomBuffer(bytesLength) {
    return new Buffer(crypto.randomBytes(bytesLength));
}

// Create a new nonce
function createNonce(bytesLength) {
    return '0x' + createRandomBuffer(bytesLength).toString('hex');
}

// RSA encrypt function, param: { key: publicKey, message: messageBuffer }
function rsaEncrypt(param) {
    var logger = require('../util/logger')('crypto.rsaEncrypt');

    var publicKey = param.key;
    var messageBuffer = param.message;
    var messageLength = messageBuffer.length;
    if (!messageBuffer || messageLength > 255) {
        logger.warn('Message is undefined or exceeds 255 bytes length.');
        return;
    }
    if (messageLength < 255) {
        // Add random bytes as padding
        var paddingLength = 255 - messageLength;
        messageBuffer = Buffer.concat([messageBuffer, createRandomBuffer(paddingLength)]);
    }
    if (logger.isDebugEnabled()) logger.debug('Message to be encrypt (%s) = %s',
        messageBuffer.length, messageBuffer.toString('hex'));
    // Encrypt the message
    var modulus = new BigInteger(publicKey.getModulus(), 16);
    var exponent = new BigInteger(publicKey.getExponent(), 16);
    var message = new BigInteger(messageBuffer);
    var encryptedMessage = new Buffer(message.modPowInt(exponent, modulus).toByteArray());
    if (encryptedMessage.length > 256) {
        encryptedMessage = encryptedMessage.slice(encryptedMessage.length - 256);
    }
    if (logger.isDebugEnabled()) logger.debug('Encrypted message(%s) = %s', encryptedMessage.length, encryptedMessage.toString('hex'));
    return encryptedMessage;
}
