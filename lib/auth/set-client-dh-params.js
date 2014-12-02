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
        callback: function (ex, setClientDHParamsAnswer, duration) {
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
                    callback(null, context, duration);
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

function createError(msg, code) {
    var error = new Error(msg);
    error.code = code;
    return error;
}
