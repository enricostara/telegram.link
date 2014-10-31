//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the Simplified BSD License
//       http://telegram.link

// Export the classes
exports.PublicKey = require('./public-key');
exports.PQFinder = require('./pq-finder');

// Export functions
exports.createSHA1Hash = createSHA1Hash;
exports.createRandomBuffer = createRandomBuffer;
exports.createNonce = createNonce;
exports.rsaEncrypt = rsaEncrypt;
exports.aesDecrypt = aesDecrypt;

// Import dependencies
var crypto = require('crypto');
var util = require('util');
var BigInteger = require('jsbn');
var CryptoJS = require("node-cryptojs-aes").CryptoJS;

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

// AES decrypt function
function aesDecrypt(param) {
    var logger = require('../util/logger')('crypto.aesDecrypt');
    if (logger.isDebugEnabled()) logger.debug('param = %s', JSON.stringify(param));
    var encryptedMsg = buffer2WordArray(param.msg);
    if (logger.isDebugEnabled()) logger.debug('encryptedMsg = %s', JSON.stringify(encryptedMsg));
    var keyWordArray = buffer2WordArray(param.key);
    if (logger.isDebugEnabled()) logger.debug('keyWordArray = %s', JSON.stringify(keyWordArray));
    var ivWordArray = buffer2WordArray(param.iv);
    if (logger.isDebugEnabled()) logger.debug('ivWordArray = %s', JSON.stringify(ivWordArray));
    var decryptedWordArray = CryptoJS.AES.decrypt({ciphertext: encryptedMsg}, keyWordArray, {
        iv: ivWordArray,
        padding: CryptoJS.pad.NoPadding,
        mode: CryptoJS.mode.IGE
    });
    if (logger.isDebugEnabled()) logger.debug('decryptedWordArray = %s', JSON.stringify(decryptedWordArray));
    return wordArray2Buffer(decryptedWordArray);
}

function buffer2WordArray(buffer) {
    var length = buffer.length;
    var wordArray = [];
    for (var i = 0; i < length; i++) {
        wordArray[i >>> 2] |= buffer[i] << (24 - 8 * (i % 4));
    }
    return new CryptoJS.lib.WordArray.init(wordArray, length);
}

function wordArray2Buffer(wordArray) {
    var words = wordArray.words;
    var sigBytes = wordArray.sigBytes;
    var buffer = new Buffer(sigBytes);
    for (var i = 0; i < sigBytes; i++) {
        buffer.writeUInt8((words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff, i);
    }
    return buffer;
}