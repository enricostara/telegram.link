//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     https://github.com/enricostara/telegram-mt-node

// Export the class
module.exports = exports = SetClientDHParams;

// Import dependencies
var flow = require('get-flow');
var logger = require('get-log')('auth.SetClientDHParams');
var mtproto = require('telegram-mt-node');
var utility = mtproto.utility;
var security = mtproto.security;
var AuthKey = require('./auth-key');

// Requires a callback function and the connection
function SetClientDHParams(callback, context) {
    flow.runSeries([
        createClientDHInnerData,
        encryptClientDHInnerDataWithAES,
        setClientDHParams
    ], callback, context);
}

// Calculate the g_b = pow(g, b) mod dh_prime
// Create the client DH inner data
function createClientDHInnerData(context) {
    var retryCount = 0;
    if (logger.isDebugEnabled()) {
        logger.debug('Start calculating g_b');
    }
    // Calculate g_b
    var g = context.serverDHInnerData.g;
    var b = utility.createNonce(256);
    var dhPrime = context.serverDHInnerData.dh_prime;
    var gb = utility.modPow(g, b, dhPrime);
    if (logger.isDebugEnabled()) {
        logger.debug('g_b(%s) = %s', gb.length, gb.toString('hex'));
    }
    // Create client DH inner data
    context.clientDHInnerData = new mtproto.type.Client_DH_inner_data({props: {
        nonce: context.resPQ.nonce,
        server_nonce: context.resPQ.server_nonce,
        retry_id: retryCount,
        g_b: gb
    }}).serialize();
    context.b = b;
    return context;
}

// Encrypt Client DH inner data
function encryptClientDHInnerDataWithAES(context) {
    var hash = utility.createSHA1Hash(context.clientDHInnerData);
    var dataWithHash = Buffer.concat([hash, context.clientDHInnerData]);
    if (logger.isDebugEnabled()) {
        logger.debug('Data to be encrypted contains: hash(%s), clientDHInnerData(%s), total length %s',
            hash.length, context.clientDHInnerData.length, dataWithHash.length);
    }
    context.encryptClientDHInnerData = security.cipher.aesEncrypt(
        dataWithHash,
        context.aes.key,
        context.aes.iv
    );
    if (logger.isDebugEnabled()) {
        logger.debug('encryptClientDHInnerData(%s) = %s',
            context.encryptClientDHInnerData.length, context.encryptClientDHInnerData.toString('hex'));
    }
    return context;
}

// Set client DH parameters
function setClientDHParams(callback, context) {
    mtproto.service.set_client_DH_params({
        props: {
            nonce: context.resPQ.nonce,
            server_nonce: context.resPQ.server_nonce,
            encrypted_data: context.encryptClientDHInnerData
        },
        conn: context.connection,
        callback: function (ex, setClientDHParamsAnswer) {
            if (ex) {
                logger.error(ex);
                if (callback) {
                    callback(ex);
                }
            } else {
                if (setClientDHParamsAnswer.typeName === 'mtproto.type.Dh_gen_ok') {
                    if (logger.isDebugEnabled()) {
                        logger.debug('\'Dh_gen_ok\' received from Telegram.');
                    }
                    context.setClientDHParamsAnswer = setClientDHParamsAnswer;
                    createAuthKey(callback, context);
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

// Manage the OK answer on DH generation and create the AuthKey
function createAuthKey(callback, context) {
    // Extract the nonces
    var newNonce = utility.string2Buffer(context.newNonce, 32);
    var serverNonce = utility.string2Buffer(context.resPQ.server_nonce, 16);
    // Calculate authKeyValue
    var ga = context.serverDHInnerData.g_a;
    var b = context.b;
    var dhPrime = context.serverDHInnerData.dh_prime;
    var authKeyValue = utility.modPow(ga, b, dhPrime);
    if (logger.isDebugEnabled()) {
        logger.debug('authKeyValue(%s) = %s', authKeyValue.length, authKeyValue.toString('hex'));
    }
    // Calculate AuthKey hashes and ID
    var authKeyHash = utility.createSHA1Hash(authKeyValue);
    var authKeyAuxHash = authKeyHash.slice(0, 8);
    var authKeyID = authKeyHash.slice(-8);
    if (logger.isDebugEnabled()) {
        logger.debug('authKeyID(%s) = %s', authKeyID.length, authKeyID.toString('hex'));
    }
    // Withstand replay-attacks
    var newNonce1 = Buffer.concat([newNonce, new Buffer([1]), authKeyAuxHash]);
    var newNonceHash = utility.buffer2String(utility.createSHA1Hash(newNonce1).slice(-16));
    var serverNewNonceHash = context.setClientDHParamsAnswer.new_nonce_hash1;
    if (logger.isDebugEnabled()) {
        logger.debug('newNonceHash = %s, new_nonce_hash1 = %s', newNonceHash.toString(),  serverNewNonceHash.toString());
    }
    if(newNonceHash !== serverNewNonceHash) {
        logger.warn('\'dh_gen_ok.new_nonce_hash1\' check fails!');
        callback(createError(newNonceHash + ' != ' + serverNewNonceHash, 'EREPLAYATTACK'));
    }
    // Create the serverSalt
    var serverSalt = utility.xor(newNonce.slice(0, 8), serverNonce.slice(0, 8));
    if (logger.isDebugEnabled()) {
        logger.debug('serverSalt(%s) = %s', serverSalt.length, serverSalt.toString('hex'));
    }
    // Create the AuthKey
    var authKey = new AuthKey(authKeyID, authKeyValue, serverSalt);
    if (logger.isDebugEnabled()) {
        logger.debug('authKey = %s', authKey.toString());
    }
    callback(null, authKey);
}

function createError(msg, code) {
    var error = new Error(msg);
    error.code = code;
    return error;
}
