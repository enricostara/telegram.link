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
var HttpConnection = exports.net.HttpConnection;
var AbstractObject = exports.type_language.AbstractObject;
var mtproto = exports.mtproto;
var util = exports.util;

// The constructor requires a primary telegram DataCenter address as argument
function TelegramLink(primaryDC) {
    this._connection = new TcpConnection(primaryDC);
    /*
     this._connection = new HttpConnection({
     proxyHost: process.env.PROXY_HOST,
     proxyPort: process.env.PROXY_PORT,
     host: primaryDC.host,
     port: primaryDC.port
     });
     */
}

// The method creates a connection to the DataCenter,
// you provide callback functions to know when is done or to catch an error
TelegramLink.prototype.connect = function (callback) {
    this._connection.connect(callback);
};

// The method gets a first authorization from the DataCenter,
// you provide callback functions to know when is done or to catch an error
TelegramLink.prototype.authorization = function (callback) {
    var logger = exports.util.Logger('TelegramLink.authorization');

    // Create a nonce for the client
    var clientNonce = crypto.createNonce(16);

    // Request a PQ pair number
    mtproto.req_pq({
        props: {
            nonce: clientNonce
        },
        conn: this._connection,
        callback: function (ex, resPQ) {
            if(ex) {
                logger.error(ex);
                if(callback) callback(ex);
                return;
            }
            if(logger.isDebugEnabled()) {
                logger.debug('\'nonce\' check: %s == %s ? %s', clientNonce, resPQ.nonce, clientNonce == resPQ.nonce);
            }
            var pqFinder = new crypto.PQFinder(resPQ.pq);
            if(logger.isDebugEnabled()) logger.debug('Start finding P and Q, with PQ = %s', pqFinder.getPQPairNumber());
            var pq = pqFinder.findPQ();
            if(logger.isDebugEnabled()) logger.debug('Found P = %s and Q = %s', pq[0], pq[1]);

            // Find the correct Public Key using fingerprint from server response
            var publicKey;
            var fingerprints = resPQ.server_public_key_fingerprints.getList();
            var fingerprint;
            if(logger.isDebugEnabled()) logger.debug('Public keys fingerprints from server: %s', fingerprints);
            for (var i = 0; i < fingerprints.length; i++) {
                fingerprint = fingerprints[i];
                if(logger.isDebugEnabled()) logger.debug('Searching fingerprint %s in store', fingerprint);
                publicKey = crypto.PublicKey.retrieveKey(fingerprint);
                if (publicKey) {
                    if(logger.isDebugEnabled()) logger.debug('Fingerprint %s found in keyStore.', fingerprint);
                    break;
                } else {
                    var msg = 'Fingerprint %s from server not found in keyStore.';
                    logger.error(msg, fingerprint);
                    callback({code: 'EFINGERNOTFOUND', msg: msg});
                }
            }
            // Create the pq_inner_data buffer
            var pqAsBuffer = pqFinder.getPQAsBuffer();
            var newNonce32 = crypto.createNonce(32);
            var serverNonce = resPQ.server_nonce;
            var pqInnerData = new mtproto.P_q_inner_data({props: {
                pq: resPQ.pq,
                p: pqAsBuffer[0],
                q: pqAsBuffer[1],
                nonce: clientNonce,
                server_nonce: serverNonce,
                new_nonce: newNonce32
            }}).serialize();
            // Create the data with hash to be encrypt
            var hash = crypto.createSHA1Hash(pqInnerData);
            var dataWithHash = Buffer.concat([hash, pqInnerData]);
            if(logger.isDebugEnabled()) {
                logger.debug('Data to be encrypt contain: hash(%s), pqInnerData(%s), total length %s',
                    hash.toString('hex'), pqInnerData.toString('hex'), dataWithHash.length);
            }
            // Encrypt data with RSA
            var encryptedData = crypto.rsaEncrypt({message: dataWithHash, key: publicKey});
            // Request server DH parameters
            mtproto.req_DH_params({
                props: {
                    nonce: clientNonce,
                    server_nonce: serverNonce,
                    p: pqAsBuffer[0],
                    q: pqAsBuffer[1],
                    public_key_fingerprint: fingerprint,
                    encrypted_data: encryptedData
                },
                conn: this._connection,
                callback: function (ex, serverDHParams) {
                    if(ex) {
                        logger.error(ex);
                        if(callback) callback(ex);
                    }
                    if (serverDHParams instanceof mtproto.Server_DH_params_ok) {
                        if(logger.isDebugEnabled()) logger.debug('\'Server_DH_params_ok\' received from Telegram.');
                        callback(null, serverDHParams);
                    } else if (serverDHParams instanceof mtproto.Server_DH_params_ko) {
                        logger.warn('\'Server_DH_params_ko\' received from Telegram!');
                        callback(serverDHParams);
                    } else {
                        var msg = 'Unknown error received from Telegram!';
                        logger.error(msg);
                        callback({code: 'EUNKNOWN', msg: msg});
                    }
                }.bind(this)
            });

        }.bind(this)
    });

};

// The method closes the communication with the DataCenter,
// you can provide a callback function to know when is done or to catch an error
TelegramLink.prototype.end = function (callback) {
    this._connection.close(callback);
};
