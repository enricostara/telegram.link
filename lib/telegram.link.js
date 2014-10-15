//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the BSD-3-Clause license
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
//var HttpConnection = exports.net.HttpConnection;
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
    // Put connection in the scope
    var connection = this._connection;

    // Run, run, run ...
    util.retryUntilItsDone(callback, null,
        function (callback) {
            util.runSeries(callback, [
                requestPQ,
                findPAndQ,
                findPublicKey,
                createPQInnerData,
                encryptDataWithRSA,
                requestDHParams,
                decryptDHParams
            ]);
        });

    // Request a PQ pair number
    function requestPQ(callback) {
        // Create a nonce for the client
        var clientNonce = crypto.createNonce(16);
        mtproto.req_pq({
            props: {
                nonce: clientNonce
            },
            conn: connection,
            callback: function (ex, resPQ) {
                if (clientNonce == resPQ.nonce) {
                    callback(null, resPQ);
                } else {
                    callback({code: 'ENONCE', msg: 'Nonce mismatch.'});
                }
            }
        });
    }

    // Find the P and Q prime numbers
    function findPAndQ(resPQ) {
        var pqFinder = new crypto.PQFinder(resPQ.pq);
        if (logger.isDebugEnabled()) logger.debug('Start finding P and Q, with PQ = %s', pqFinder.getPQPairNumber());
        var pq = pqFinder.findPQ();
        if (logger.isDebugEnabled()) logger.debug('Found P = %s and Q = %s', pq[0], pq[1]);
        return {
            pBuffer: pqFinder.getPQAsBuffer()[0],
            qBuffer: pqFinder.getPQAsBuffer()[1],
            resPQ: resPQ
        };
    }

    // Find the correct Public Key using fingerprint from server response
    function findPublicKey(obj) {
        var fingerprints = obj.resPQ.server_public_key_fingerprints.getList();
        if (logger.isDebugEnabled()) logger.debug('Public keys fingerprints from server: %s', fingerprints);
        for (var i = 0; i < fingerprints.length; i++) {
            var fingerprint = fingerprints[i];
            if (logger.isDebugEnabled()) logger.debug('Searching fingerprint %s in store', fingerprint);
            var publicKey = crypto.PublicKey.retrieveKey(fingerprint);
            if (publicKey) {
                if (logger.isDebugEnabled()) logger.debug('Fingerprint %s found in keyStore.', fingerprint);
                obj.fingerprint = fingerprint;
                obj.publicKey = publicKey;
                return obj;
            }
        }
        throw {code: 'EFINGERNOTFOUND', msg: 'Fingerprints from server not found in keyStore.'};
    }

    // Create the pq_inner_data buffer
    function createPQInnerData(obj) {
        var resPQ = obj.resPQ;
        var newNonce = crypto.createNonce(32);
        var pqInnerData = new mtproto.P_q_inner_data({props: {
            pq: resPQ.pq,
            p: obj.pBuffer,
            q: obj.qBuffer,
            nonce: resPQ.nonce,
            server_nonce: resPQ.server_nonce,
            new_nonce: newNonce
        }}).serialize();
        obj.pqInnerData = pqInnerData;
        obj.newNonce = newNonce;
        return obj;
    }

    // Encrypt the pq_inner_data
    function encryptDataWithRSA(obj) {
        // Create the data with hash to be encrypt
        var hash = crypto.createSHA1Hash(obj.pqInnerData);
        var dataWithHash = Buffer.concat([hash, obj.pqInnerData]);
        if (logger.isDebugEnabled()) {
            logger.debug('Data to be encrypt contain: hash(%s), pqInnerData(%s), total length %s',
                hash.toString('hex'), obj.pqInnerData.toString('hex'), dataWithHash.length);
        }
        // Encrypt data with RSA
        obj.encryptedData = crypto.rsaEncrypt({message: dataWithHash, key: obj.publicKey});
        return obj;
    }

    // Request server DH parameters
    function requestDHParams(callback, obj) {
        var resPQ = obj.resPQ;
        mtproto.req_DH_params({
            props: {
                nonce: resPQ.nonce,
                server_nonce: resPQ.server_nonce,
                p: obj.pBuffer,
                q: obj.qBuffer,
                public_key_fingerprint: obj.fingerprint,
                encrypted_data: obj.encryptedData
            },
            conn: connection,
            callback: function (ex, serverDHParams) {
                if (ex) {
                    logger.error(ex);
                    if (callback) callback(ex);
                } else {
                    if (serverDHParams.typeName == 'mtproto.Server_DH_params_ok') {
                        if (logger.isDebugEnabled()) logger.debug('\'Server_DH_params_ok\' received from Telegram.');
                        obj.serverDHParams = serverDHParams;
                        callback(null, obj);
                    } else if (serverDHParams.typeName == 'mtproto.Server_DH_params_ko') {
                        logger.warn('\'Server_DH_params_ko\' received from Telegram!');
                        callback({code: 'EDHPARAMKO', msg: serverDHParams});
                    } else {
                        var msg = 'Unknown error received from Telegram!';
                        logger.error(msg);
                        callback({code: 'EUNKNOWN', msg: msg});
                    }
                }
            }
        });
    }

    // Decrypt DH parameters
    function decryptDHParams(obj) {
        var newNonce = AbstractObject.stringValue2Buffer(obj.newNonce, 32);
        var serverNonce = AbstractObject.stringValue2Buffer(obj.resPQ.server_nonce, 16);
        if (logger.isDebugEnabled()) logger.debug('newNonce = %s, serverNonce = %s', newNonce.toString('hex'), serverNonce.toString('hex'));
        var hashNS = crypto.createSHA1Hash([newNonce, serverNonce]);
        if (logger.isDebugEnabled()) logger.debug('hashNS = %s', hashNS.toString('hex'));
        var hashSN = crypto.createSHA1Hash([serverNonce, newNonce]);
        if (logger.isDebugEnabled()) logger.debug('hashSN = %s', hashSN.toString('hex'));
        var hashNN = crypto.createSHA1Hash([newNonce, newNonce]);
        if (logger.isDebugEnabled()) logger.debug('hashNN = %s', hashNN.toString('hex'));
        var aesKey = Buffer.concat([hashNS, hashSN.slice(0, 12)]);
        if (logger.isDebugEnabled()) logger.debug('aesKey = %s', aesKey.toString('hex'));
        var aesIv = Buffer.concat([Buffer.concat([hashSN.slice(12), hashNN]), newNonce.slice(0, 4)]);
        if (logger.isDebugEnabled()) logger.debug('aesIv = %s', aesIv.toString('hex'));
        var answerWithHash = crypto.aesDecrypt({
            msg: obj.serverDHParams.encrypted_answer,
            key: aesKey,
            iv: aesIv
        });
        if (logger.isDebugEnabled()) logger.debug('answerWithHash = %s', answerWithHash.toString('hex'));
        var answer =  answerWithHash.slice(20);
        if (logger.isDebugEnabled()) logger.debug('answer = %s', answerWithHash.toString('hex'));
        var serverDHInnerData = new mtproto.Server_DH_inner_data({
            buffer: answer
        }).deserialize();
        if (logger.isDebugEnabled()) logger.debug('serverDHInnerData = %s', JSON.stringify(serverDHInnerData));
        return obj;
    }
};

// The method closes the communication with the DataCenter,
// you can provide a callback function to know when is done or to catch an error
TelegramLink.prototype.end = function (callback) {
    this._connection.close(callback);
};
