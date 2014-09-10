//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

//      TcpConnection class
//
// This class provides a TCP socket to communicate with `Telegram` using `MTProto` protocol

// Import dependencies
var debug = require('debug')('telegram.link:net.TcpConnection');
var net = require('net');
var util = require('util');
var AbstractObject = require("../type_language").AbstractObject;

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
        if (callback) {
            callback();
        }
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

    var message = new TcpConnection.Message({message: data});
    var request = message.serialize();

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
        var message = new TcpConnection.Message({buffer: data}).deserialize();
        var payload = message.getMessage();
        debug('read %s bytes from %s', payload.length, this._config);

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

// TcpConnection inner class:
//
//      TcpConnection.Message class
//
// To get an instance for `serialization`:
//
//      new TcpConnection.Message({message: myMessageBuffer});
// Provide the payload as `Buffer`:
//
// To get an instance for `de-serialization`:
//
//      new TcpConnection.Message({buffer: myBuffer});
// Provide a `buffer` containing the plain message from which extract the payload
//
// The `constructor`:
TcpConnection.Message = function (options) {
    var super_ = this.constructor.super_.bind(this);
    var opts = options ? options : {};
    this._message = opts.message;
    super_(opts.buffer, opts.offset);
    if (this._message) {
        this._message = Buffer.isBuffer(this._message) ? this._message : new Buffer(this._message, 'hex');
    }
};

util.inherits(TcpConnection.Message, AbstractObject);

// This method serialize the Message
TcpConnection.Message.prototype.serialize = function () {
    if (!this._message) {
        return false;
    }
    this.writeBytes(this._message, true);
    return this.retrieveBuffer();
};

// This method de-serialize the Message
TcpConnection.Message.prototype.deserialize = function () {
    if (!this.isReadonly()) {
        return false;
    }
    this._message = this.readBytes(true);
    return this;
};

// This method returns the payload
TcpConnection.Message.prototype.getMessage = function () {
    return this._message;
};

// Export the class
module.exports = exports = TcpConnection;