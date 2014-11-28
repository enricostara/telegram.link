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
console.log('v.%s', require('../package.json').version);

// Register the project name on the logging sys
var getLogger = require('get-log');
getLogger.PROJECT_NAME = require('../package.json').name;

// Export the class
module.exports = exports = TelegramLink;

// Import dependencies
var TypeObject = require('telegram-tl-node').TypeObject;
var mtproto = require('telegram-mt-node');
var flow = require('get-flow');
var TcpConnection = mtproto.net.TcpConnection;
var HttpConnection = mtproto.net.HttpConnection;
var utility = mtproto.utility;
var security = mtproto.security;


// The constructor requires a primary telegram DataCenter address as argument
function TelegramLink(primaryDC, connectionType) {
    if (connectionType && 'TCP' === connectionType) {
        this._connection = new TcpConnection(primaryDC);
    } else {
        this._connection = new HttpConnection(primaryDC);
    }
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
                encryptPQInnerDataWithRSA,
                requestDHParams,
                decryptDHParams,
                deserializeDHInnerData,
                createClientDHInnerData,
                encryptClientDHInnerDataWithAES,
                setClientDHParams
            ], callback);
        });

    // Request a PQ pair number
    function requestPQ(callback) {
        // Create a nonce for the client
        var clientNonce = utility.createNonce(16);
        mtproto.service.req_pq({
            props: {
                nonce: clientNonce
            },
            conn: connection,
            callback: function (ex, resPQ) {
                if (clientNonce === resPQ.nonce) {
                    callback(null, resPQ);
                } else {
                    callback(createError('Nonce mismatch.', 'ENONCE'));
                }
            }
        });
    }

    // Find the P and Q prime numbers
    function findPAndQ(resPQ) {
        var pqFinder = new security.PQFinder(resPQ.pq);
        if (logger.isDebugEnabled()) {
            logger.debug('Start finding P and Q, with PQ = %s', pqFinder.getPQPairNumber());
        }
        var pq = pqFinder.findPQ();
        if (logger.isDebugEnabled()) {
            logger.debug('Found P = %s and Q = %s', pq[0], pq[1]);
        }
        return {
            pBuffer: pqFinder.getPQAsBuffer()[0],
            qBuffer: pqFinder.getPQAsBuffer()[1],
            resPQ: resPQ
        };
    }

    // Find the correct Public Key using fingerprint from server response
    function findPublicKey(obj) {
        var fingerprints = obj.resPQ.server_public_key_fingerprints.getList();
        if (logger.isDebugEnabled()) {
            logger.debug('Public keys fingerprints from server: %s', fingerprints);
        }
        for (var i = 0; i < fingerprints.length; i++) {
            var fingerprint = fingerprints[i];
            if (logger.isDebugEnabled()) {
                logger.debug('Searching fingerprint %s in store', fingerprint);
            }
            var publicKey = security.PublicKey.retrieveKey(fingerprint);
            if (publicKey) {
                if (logger.isDebugEnabled()) {
                    logger.debug('Fingerprint %s found in keyStore.', fingerprint);
                }
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
        var newNonce = utility.createNonce(32);
        var pqInnerData = new mtproto.type.P_q_inner_data({props: {
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

    // Encrypt the pq_inner_data with RSA
    function encryptPQInnerDataWithRSA(obj) {
        // Create the data with hash to be encrypt
        var hash = utility.createSHA1Hash(obj.pqInnerData);
        var dataWithHash = Buffer.concat([hash, obj.pqInnerData]);
        if (logger.isDebugEnabled()) {
            logger.debug('Data to be encrypted contains: hash(%s), pqInnerData(%s), total length %s',
                hash.length, obj.pqInnerData.length, dataWithHash.length);
        }
        // Encrypt data with RSA
        obj.encryptedData = security.cipher.rsaEncrypt(dataWithHash, obj.publicKey);
        return obj;
    }

    // Request server DH parameters
    function requestDHParams(callback, obj) {
        var resPQ = obj.resPQ;
        mtproto.service.req_DH_params({
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
                    if (callback) {
                        callback(ex);
                    }
                } else {
                    if (serverDHParams.typeName === 'mtproto.type.Server_DH_params_ok') {
                        if (logger.isDebugEnabled()) {
                            logger.debug('\'Server_DH_params_ok\' received from Telegram.');
                        }
                        obj.serverDHParams = serverDHParams;
                        obj.reqDHDuration = duration;
                        callback(null, obj);
                    } else if (serverDHParams.typeName === 'mtproto.type.Server_DH_params_ko') {
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
    function decryptDHParams(obj) {
        var newNonce = TypeObject.stringValue2Buffer(obj.newNonce, 32);
        var serverNonce = TypeObject.stringValue2Buffer(obj.resPQ.server_nonce, 16);
        if (logger.isDebugEnabled()) {
            logger.debug('newNonce = %s, serverNonce = %s', newNonce.toString('hex'), serverNonce.toString('hex'));
        }
        var hashNS = utility.createSHA1Hash([newNonce, serverNonce]);
        var hashSN = utility.createSHA1Hash([serverNonce, newNonce]);
        var hashNN = utility.createSHA1Hash([newNonce, newNonce]);
        if (logger.isDebugEnabled()) {
            logger.debug('hashNS = %s, hashSN = %s, hashNN = %s',
                hashNS.toString('hex'), hashSN.toString('hex'), hashNN.toString('hex'));
        }
        // Create the AES key
        var aesKey = Buffer.concat([hashNS, hashSN.slice(0, 12)]);
        var aesIv = Buffer.concat([Buffer.concat([hashSN.slice(12), hashNN]), newNonce.slice(0, 4)]);
        if (logger.isDebugEnabled()) {
            logger.debug('aesKey = %s, aesIv = %s', aesKey.toString('hex'), aesIv.toString('hex'));
        }
        // Decrypt the message
        var answerWithHash = security.cipher.aesDecrypt(
            obj.serverDHParams.encrypted_answer,
            aesKey,
            aesIv
        );
        obj.decryptedDHParams = answerWithHash;
        // Save AES key
        obj.aes = {key: aesKey, iv: aesIv};
        return obj;
    }

    // De-serialize the server DH inner data
    function deserializeDHInnerData(obj) {
        var decryptedDHParamsWithHash = obj.decryptedDHParams;
        if (logger.isDebugEnabled()) {
            logger.debug('decryptedDHParamsWithHash(%s) = %s', decryptedDHParamsWithHash.length, decryptedDHParamsWithHash.toString('hex'));
        }
        var decryptedDHParams = decryptedDHParamsWithHash.slice(20, 564 + 20);
        if (logger.isDebugEnabled()) {
            logger.debug('decryptedDHParams(%s) = %s', decryptedDHParams.length, decryptedDHParams.toString('hex'));
        }
        var serverDHInnerData = new mtproto.type.Server_DH_inner_data({
            buffer: decryptedDHParams
        }).deserialize();
        if (logger.isDebugEnabled()) {
            logger.debug('serverDHInnerData = %s obtained in %sms', JSON.stringify(serverDHInnerData), obj.reqDHDuration);
        }
        // Check if the nonces are consistent
        if (serverDHInnerData.nonce !== obj.serverDHParams.nonce) {
            throw createError('Nonce mismatch %s != %s', obj.serverDHParams.nonce, serverDHInnerData.nonce);
        }
        if (serverDHInnerData.server_nonce !== obj.serverDHParams.server_nonce) {
            throw createError('ServerNonce mismatch %s != %s', obj.serverDHParams.server_nonce, serverDHInnerData.server_nonce);
        }
        // Synch the local time with the server time
        mtproto.time.timeSynchronization(serverDHInnerData.server_time * 1000, obj.reqDHDuration);
        obj.serverDHInnerData = serverDHInnerData;
        return obj;
    }

    // Calculate the g_b = pow(g, b) mod dh_prime
    // Create the client DH inner data
    function createClientDHInnerData(obj) {
        var retryCount = 0;
        if (logger.isDebugEnabled()) {
            logger.debug('Start calculating g_b');
        }
        // Calculate g_b
        var g = obj.serverDHInnerData.g;
        var b = utility.createNonce(256);
        var dhPrime = obj.serverDHInnerData.dh_prime;
        var gb = utility.modPow(g, b, dhPrime);
        if (logger.isDebugEnabled()) {
            logger.debug('g_b(%s) = %s', gb.length, gb.toString('hex'));
        }
        // Create client DH inner data
        obj.clientDHInnerData = new mtproto.type.Client_DH_inner_data({props: {
            nonce: obj.resPQ.nonce,
            server_nonce: obj.resPQ.server_nonce,
            retry_id: retryCount,
            g_b: gb
        }}).serialize();
        return obj;
    }

    // Encrypt Client DH inner data
    function encryptClientDHInnerDataWithAES(obj) {
        var hash = utility.createSHA1Hash(obj.clientDHInnerData);
        var dataWithHash = Buffer.concat([hash, obj.clientDHInnerData]);
        if (logger.isDebugEnabled()) {
            logger.debug('Data to be encrypted contains: hash(%s), clientDHInnerData(%s), total length %s',
                hash.length, obj.clientDHInnerData.length, dataWithHash.length);
        }
        obj.encryptClientDHInnerData = security.cipher.aesEncrypt(
            dataWithHash,
            obj.aes.key,
            obj.aes.iv
        );
        if (logger.isDebugEnabled()) {
            logger.debug('encryptClientDHInnerData(%s) = %s',
                obj.encryptClientDHInnerData.length, obj.encryptClientDHInnerData.toString('hex'));
        }
        return obj;
    }

    // Set client DH parameters
    function setClientDHParams(callback, obj) {
        mtproto.service.set_client_DH_params({
            props: {
                nonce: obj.resPQ.nonce,
                server_nonce: obj.resPQ.server_nonce,
                encrypted_data: obj.encryptClientDHInnerData
            },
            conn: connection,
            callback: function (ex, setClientDHParamsAnswer, duration) {
                if (ex) {
                    logger.error(ex);
                    if (callback) callback(ex);
                } else {
                    if (setClientDHParamsAnswer.typeName === 'mtproto.type.Dh_gen_ok') {
                        if (logger.isDebugEnabled()) {
                            logger.debug('\'Dh_gen_ok\' received from Telegram.');
                        }
                        obj.setClientDHParamsAnswer = setClientDHParamsAnswer;
                        callback(null, obj, duration);
                    } else if (setClientDHParamsAnswer.typeName === 'mtproto.type.Dh_gen_retry') {
                        logger.warn('\'Dh_gen_retry\' received from Telegram!');
                        callback(createError(JSON.stringify(setClientDHParamsAnswer), 'EDHPARAMRETRY'));
                    } else if (setClientDHParamsAnswer.typeName === 'mtproto.type.Dh_gen_fail') {
                        logger.warn('\'Dh_gen_fail\' received from Telegram!');
                        callback(createError(JSON.stringify(setClientDHParamsAnswer), 'EDHPARAMFAIL'));
                    } else {
                        var msg = 'Unknown error received from Telegram!';
                        logger.error(msg);
                        callback(createError(msg, 'EUNKNOWN'));
                    }
                }
            }
        });
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
