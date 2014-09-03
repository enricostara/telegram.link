//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link


//      TelegramLink class
//
// This is the entry-point of Telegram.link library, and lists high level methods to communicate with `TELEGRAM`


// Exports the class
module.exports = exports = TelegramLink;

// Exports modules
exports.mtproto = require('./mtproto');
exports.net = require('./net');
exports.type_language = require('./type_language');
exports.util = require('./util');

// Imports dependencies
var debug = require('debug')('telegram.link:TelegramLink');
var staticInfo = require('./static');
var crypto = require('crypto');
var TcpConnection = exports.net.TcpConnection;
var AbstractObject = exports.type_language.AbstractObject;


console.log(staticInfo.signature);
console.log('v.%s', staticInfo.version);

// The constructor requires a primary telegram DataCenter address as argument
function TelegramLink(primaryDC) {
    this._connection = new TcpConnection(primaryDC);
}

// Creates a connection to the DataCenter,
// you provide callback functions to know when is done or to catch an error
TelegramLink.prototype.connect = function (callback, errorback) {
    this._connection.connect(callback, errorback);
};

// Gets a first authorization from the DataCenter,
// you provide callback functions to know when is done or to catch an error
TelegramLink.prototype.authorization = function (callback, errorback) {

    var authKeyId = '0';
    var messageId = (new Date().getTime() / 1000) << 32;
    var messageLength = 20;
    var id = 0x60469778;
    var nonce = new Buffer(crypto.randomBytes(16));

    var reqPQ = new AbstractObject();
    reqPQ.writeLong(authKeyId);
    reqPQ.writeLong(messageId);
    reqPQ.writeInt(messageLength);
    reqPQ.writeInt(id);
    reqPQ.writeInt128(nonce);
    var request = reqPQ.retrieveBuffer();

    this._connection.write(request, function () {
        debug(request);

        this._connection.read(function (response) {
            debug(response);

            var resPQ = new AbstractObject(response);
            var responseObj = {
                auth_key_id: resPQ.readLong(),
                message_id: resPQ.readLong(),
                message_length: resPQ.readInt(),
                res_pq_id: resPQ.readInt(),
                nonce: resPQ.readInt128(),
                server_nonce: resPQ.readInt128(),
                pq: resPQ.readBytes(),
                vector_id: resPQ.readInt(),
                count: resPQ.readInt(),
                fingerprint: resPQ.readLong()
            };

            debug(responseObj);

            callback(response);
        }, function (e) {
            debug(e);
            errorback(e);
        });

    }.bind(this), function (e) {
        debug(e);
        errorback(e);
    });
};

// Close the communication with the DataCenter,
// you provide callback functions to know when is done or to catch an error
TelegramLink.prototype.end = function (callback, errorback) {
    this._connection.close(callback, errorback);
};
