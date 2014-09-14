//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

//      TelegramLink class
//
// This is the entry-point of Telegram.link library, and it lists high level methods to communicate with `TELEGRAM`

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

// Import dependencies
var logger = exports.util.Logger('telegram.link:TelegramLink');
var crypto = require('crypto');
var TcpConnection = exports.net.TcpConnection;
var AbstractObject = exports.type_language.AbstractObject;
var mtproto = exports.mtproto;

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

    var clientNonce = '0xf67b7768bf4854bb15fa840ec843875f';

    mtproto.req_pq({
        props: {
            nonce: clientNonce
        },
        conn: this._connection,
        callback: function (resPQ) {
            logger.debug('nonce check: %s == %s ? %s', clientNonce, resPQ.nonce, clientNonce == resPQ.nonce);
            callback(resPQ);
        },
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
