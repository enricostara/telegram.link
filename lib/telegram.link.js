//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

//      TelegramLink class
//
// This is the entry-point of Telegram.link library, and it lists high level methods to communicate
// with `TELEGRAM MESSANGER`

// Print library version
require('colors');
console.log(require('./static').signature.blue);
console.log(('v.%s', require('../package.json').version).blue);

// Export the class
module.exports = exports = TelegramLink;

// Export modules
exports.mtproto = require('./mtproto');
exports.net = require('./net');
exports.type_language = require('./type_language');
exports.util = require('./util');
exports.crypto = require('./crypto');

// Import dependencies
var crypto = exports.crypto;
var TcpConnection = exports.net.TcpConnection;
var AbstractObject = exports.type_language.AbstractObject;
var mtproto = exports.mtproto;
var util = exports.util;

// The constructor requires a primary telegram DataCenter address as argument
function TelegramLink(primaryDC) {
    this._connection = new TcpConnection(primaryDC);
}

// The method creates a connection to the DataCenter,
// you provide callback functions to know when is done or to catch an error
TelegramLink.prototype.connect = function (callback, errorback) {
    this._connection.connect(callback, errorback);
};

// The method gets a first authorization from the DataCenter,
// you provide callback functions to know when is done or to catch an error
TelegramLink.prototype.authorization = function (callback, errorback) {
    var logger = exports.util.Logger('TelegramLink.authorization');

    // Create a nonce for the client
    var clientNonce = crypto.createNonce(16);

    // Request a PQ pair number
    mtproto.req_pq({
        props: {
            nonce: clientNonce
        },
        conn: this._connection,
        callback: function (resPQ) {
            logger.debug('\'nonce\' check: %s == %s ? %s', clientNonce, resPQ.nonce, clientNonce == resPQ.nonce);

            // Find P and Q from PQ pair
            var pqFinder = new crypto.PQFinder(resPQ.pq);
            logger.debug('Start finding P and Q, with PQ = %s', pqFinder.getPQPairNumber());
            var pq = pqFinder.findPQ();
            logger.debug('Found P = %s and Q = %s', pq[0], pq[1]);

            // Find the correct Public Key using fingerprint from server response
            var publicKey;
            var fingerprints = resPQ.server_public_key_fingerprints.getList();
            logger.debug('Public keys fingerprints from server: %s', fingerprints);
            for (var i = 0; i < fingerprints.length; i++) {
                var fingerprint = fingerprints[i];
                logger.debug('Searching fingerprint %s in store', fingerprint);
                publicKey = crypto.PublicKey.retrieveKey(fingerprint);
                if (publicKey) {
                    logger.debug("Fingerprint %s found in keyStore.", fingerprint);
                    break;
                } else {
                    logger.warn("Fingerprint %s from server not found in keyStore.", fingerprint);
                    errorback();
                }
            }

            // Create the pq_inner_data buffer
            var pqAsBuffer = pqFinder.getPQAsBuffer();
            var newNonce32 = crypto.createNonce(32);
            var pqInnerData = new mtproto.P_Q_inner_data({props: {
                pq: resPQ.pq,
                p: pqAsBuffer[0],
                q: pqAsBuffer[1],
                nonce: resPQ.nonce,
                server_nonce: resPQ.server_nonce,
                new_nonce: newNonce32
            }}).serialize();

            // Create the data with hash to be encrypt
            var hash = crypto.createSHA1Hash(pqInnerData);
            var dataWithHash = Buffer.concat([hash, pqInnerData]);
            logger.debug('Data to be encrypt contain: hash(%s), pqInnerData(%s), total length %s',
                hash.length, pqInnerData.length, dataWithHash.length);

            callback();
        }.bind(this),
        errorback: function (e) {
            logger.error('Received exception %s', e);
            errorback(e);
        }
    });

};

// The method closes the communication with the DataCenter,
// you can provide a callback function to know when is done or to catch an error
TelegramLink.prototype.end = function (callback, errorback) {
    this._connection.close(callback, errorback);
};
