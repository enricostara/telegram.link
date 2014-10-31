//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the Simplified BSD License
//       http://telegram.link

//      TelegramLink class
//
// This is the entry-point of Telegram.link library, and it lists high level methods to communicate
// with `TELEGRAM MESSANGER`

// Print library version
console.log(require('./static').signature);
console.log(('v.%s', require('../package.json').version));

// Export the class
module.exports = exports = TelegramLink;

// Export modules
exports.mtproto = require('./mtproto');
exports.net = require('./net');
exports.type_language = require('./type-language');
exports.crypto_util = require('./crypto-util');

// Import dependencies
var crypto = exports.crypto_util;
var TcpConnection = exports.net.TcpConnection;
var HttpConnection = exports.net.HttpConnection;
var AbstractObject = exports.type_language.AbstractObject;
var mtproto = exports.mtproto;
var getLogger = require('get-log');
getLogger.PROJECT_NAME = require('../package.json').name;
var flow = require('get-flow');

// The constructor requires a primary telegram DataCenter address as argument
function TelegramLink(primaryDC) {
//    this._connection = new TcpConnection(primaryDC);
    this._connection = new HttpConnection({
        proxyHost: process.env.PROXY_HOST,
        proxyPort: process.env.PROXY_PORT,
        host: primaryDC.host,
        port: primaryDC.port
    });
}

// The method creates a connection to the DataCenter,
// provide a callback function to know when is done or to catch an error
TelegramLink.prototype.connect = function (callback) {
    this._connection.connect(callback);
};

// The method states the authorization key with the DataCenter,
// provide a callback function to know when is done or to catch an error
TelegramLink.prototype.authorization = function (callback) {
    var logger = getLogger('TelegramLink.authorization');
    // Put connection in the scope
    var connection = this._connection;

    // Run, run, run ...
    flow.retryUntilIsDone(callback, null,
        function (callback) {
            flow.runSeries([
                requestPQ,
                findPAndQ,
                findPublicKey,
                createPQInnerData,
                encryptDataWithRSA,
                requestDHParams,
                decryptDHParams
            ], callback);
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
                    callback(createError('Nonce mismatch.', 'ENONCE'));
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
        throw createError('Fingerprints from server not found in keyStore.', 'EFINGERNOTFOUND');
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
            callback: function (ex, serverDHParams, duration) {
                if (ex) {
                    logger.error(ex);
                    if (callback) callback(ex);
                } else {
                    if (serverDHParams.typeName == 'mtproto.Server_DH_params_ok') {
                        if (logger.isDebugEnabled()) logger.debug('\'Server_DH_params_ok\' received from Telegram.');
                        obj.serverDHParams = serverDHParams;
                        callback(null, obj, duration);
                    } else if (serverDHParams.typeName == 'mtproto.Server_DH_params_ko') {
                        logger.warn('\'Server_DH_params_ko\' received from Telegram!');
                        callback(createError(JSON.stringify(serverDHParams), 'EDHPARAMKO'));
                    } else {
                        var msg = 'Unknown error received from Telegram!';
                        logger.error(msg);
                        callback(createError(msg, 'EUNKNOWN'));
                    }
                }
            }
        });
    }

    // Decrypt DH parameters and synch the local time with the server time
    function decryptDHParams(obj, duration) {
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
        // Decrypt the message
        var answerWithHash = crypto.aesDecrypt({
            msg: obj.serverDHParams.encrypted_answer,
            key: aesKey,
            iv: aesIv
        });
        if (logger.isDebugEnabled()) logger.debug('answerWithHash(%s) = %s', answerWithHash.length, answerWithHash.toString('hex'));
        var answer = answerWithHash.slice(20, 564 + 20);
        if (logger.isDebugEnabled()) logger.debug('answer(%s) = %s', answer.length, answer.toString('hex'));
        // De-serialize the inner data
        var serverDHInnerData = new mtproto.Server_DH_inner_data({
            buffer: answer
        }).deserialize();
        if (logger.isDebugEnabled()) logger.debug('serverDHInnerData = %s obtained in %sms', JSON.stringify(serverDHInnerData), duration);
        // Check if the nonces are consistent
        if (serverDHInnerData.nonce != obj.serverDHParams.nonce) {
            throw createError('Nonce mismatch %s != %s', obj.serverDHParams.nonce, serverDHInnerData.nonce);
        }
        if (serverDHInnerData.server_nonce != obj.serverDHParams.server_nonce) {
            throw createError('ServerNonce mismatch %s != %s', obj.serverDHParams.server_nonce, serverDHInnerData.server_nonce);
        }
        // Synch the local time with the server time
        crypto.timeSynchronization(serverDHInnerData.server_time * 1000, duration);
        obj.serverDHInnerData = serverDHInnerData;
        return obj;
    }
};

function createError(msg, code) {
    var error = new Error(msg);
    error.code = code;
    return error;
}

// The method closes the communication with the DataCenter,
// provide a callback function to know when is done or to catch an error
TelegramLink.prototype.end = function (callback) {
    this._connection.close(callback);
};
