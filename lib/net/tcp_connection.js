//       Telegram.link 0.0.1
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

//      TcpConnection class
//
// This class provides a TCP socket to communicate with `Telegram` using `MTProto` protocol

// Imports dependencies
var debug = require('debug')('telegram.link:net.TcpConnection');
var net = require('net');
var util = require('util');

// The constructor accepts optionally an object to specify the connection address as following:
//
//      new TcpConnection({host: "173.240.5.253", port: "443"});
//
// `localhost:80` address is used as default otherwise
function TcpConnection(options) {
    this.options = util._extend({ host: 'localhost', port: '80', localAddress: process.env.LOCAL_ADDRESS }, options);
    this._config = JSON.stringify(this.options);
    debug('created with ' + this._config);
}

TcpConnection.prototype.connect = function (callback, errorback) {
    debug('connecting to ' + this._config);

    if (this._socket) {
        return;
    }
    var socket = net.connect(this.options, function () {
        debug('connected to ' + this._config);

        var abridgedFlag = new Buffer(1);
        abridgedFlag.writeUInt8(0xef, 0);
        debug('sending abridgedFlag to ' + this._config);
        socket.write(abridgedFlag, 'UTF8', function () {
            debug('abridgedFlag sent to ' + this._config);
            if (callback) {
                callback();
            }
        }.bind(this));
    }.bind(this));
    socket.setKeepAlive(true);
    socket.setNoDelay(true);

    if (errorback) {
        socket.on('error', function (e) {
            console.log('Error %s connecting to %s', e.code, this._config);
            this._socket = undefined;
            errorback();
        }.bind(this));
    }
    this._socket = socket;
};

TcpConnection.prototype.write = function (data, callback, errorback) {
    var socket = this._socket;

    if (!socket) {
        errorback({code: 'ENOTCONNECTED', msg: 'not yet connected'});
        return;
    }

    if ((data.length % 4) !== 0) {
        errorback({code: 'EMULTIPLE4', msg: 'data length must be multiple of 4'});
        return;
    }

    if (!Buffer.isBuffer(data)) {
        debug('given data is not a Buffer');
        data = new Buffer(data);
    }

    var dLength = data.length / 4;
    var isShort = dLength < 0x7F;
    var rLength = dLength * 4 + (isShort ? 1 : 4);
    var request = new Buffer(rLength);

    var offset = 0;
    if (isShort) {
        request.writeUInt8(dLength, offset++);
    } else {
        request.writeUInt8(0x7F, offset++);
        request.writeUInt8(dLength & 0xFF, offset++);
        request.writeUInt8((dLength >> 8) & 0xFF, offset++);
        request.writeUInt8((dLength >> 16) & 0xFF, offset++);
    }
    data.copy(request, offset);

    debug('writing %s bytes to %s', request.length, this._config);
    socket.write(request, 'UTF8', function () {
        debug('wrote %s bytes to %s', request.length, this._config);
        if (callback) {
            callback();
        }
    }.bind(this));

    if (errorback) {
        socket.on('error', function (e) {
            console.log('Error %s writing %s bytes to %s', e.code, request.length, this._config);
            errorback(e);
        }.bind(this));
    }
};

TcpConnection.prototype.read = function (callback, errorback) {
    debug('reading from %s', this._config);
    var socket = this._socket;

    if (!socket) {
        errorback({code: 'ENOTCONNECTED', msg: 'not yet connected'});
        return;
    }

    socket.on('data', function (data) {

        var offset = 0;
        var dLength = data.readUInt8(offset++);
        var isShort = dLength < 0x7F;
        if (!isShort) {
            dLength = data.readUInt8(offset++) + (data.readUInt8(offset++) << 8) + (data.readUInt8(offset++) << 16);
        }
        dLength *= 4;

        var payload = new Buffer(dLength);
        data.copy(payload, 0, offset, data.length);

        debug('read %s bytes from %s', dLength, this._config);

        if (callback) {
            callback(payload);
        }
    }.bind(this));

    if (errorback) {
        socket.on('error', function (e) {
            console.log('Error %s reading from %s', e.code, this._config);
            errorback(e);
        }.bind(this));
    }
};

TcpConnection.prototype.close = function (callback, errorback) {
    var socket = this._socket;
    if (socket) {
        debug('disconnecting from ' + this._config);

        socket.on('end', function () {
            debug('disconnected from ' + this._config);
            if (callback) {
                callback();
            }
        }.bind(this));
        if (errorback) {
            socket.on('error', function (e) {
                console.log('Error %s disconnecting from %s', e.code, this._config);
                errorback(e);
            }.bind(this));
        }
        socket.end();
        this._socket = undefined;
    }
};

// Exports the class
module.exports = exports = TcpConnection;