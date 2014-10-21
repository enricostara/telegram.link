//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the BSD-3-Clause license
//       http://telegram.link

//      AbstractObject class
//
// The `AbstractObject` class is an abstraction of the `TypeLanguage Objects and Methods` providing read/write methods to serialize/de-serialize
// the TypeLanguage binary format

// Import dependencies
var BigInt = require('bignum');

// The constructor may be called giving a `Buffer` with the binary image - eventually starting from an `offset` -
// in order to de-serialize a `TypeLanguage entity` via `read*` methods,
// otherwise you can call it without any argument and start serializing a new one via `write*` methods
function AbstractObject(buffer, offset) {
    if (buffer) {
        this._writeBuffers = null;
        this._readOffset = 0;
        buffer = Buffer.isBuffer(buffer) ? buffer : new Buffer(buffer);
        this._buffer = offset ? buffer.slice(offset) : buffer;
    } else {
        this._writeBuffers = [];
        this._writeOffset = 0;
    }
}

// The base method to de-serialize the object
AbstractObject.prototype.deserialize = function () {
    var logger = this.constructor.logger;
    if (!this.isReadonly()) {
        if (logger) logger.warn('Unable to de-serialize, the buffer is undefined');
        return false;
    }
    var id = this._readBytes(4).toString('hex');
    if (logger && logger.isDebugEnabled()) {
        logger.debug('read ID = %s', id);
    }
    if (this.id != id) {
        if (logger) logger.warn('Unable to de-serialize, (read id) %s != (this.id) %s', id, this.id);
        return false;
    }
    return this;
};

// The base method to serialize the object
AbstractObject.prototype.serialize = function () {
    var logger = this.constructor.logger;
    if (logger && logger.isDebugEnabled()) {
        logger.debug('write ID = %s', this.id);
    }
    return this._writeBytes(new Buffer(this.id, 'hex'));
};

// The method finalizes the serialization process and retrieves the `Buffer` image of the object,
// putting the instance in `readonly` state
AbstractObject.prototype.retrieveBuffer = function () {
    if (!this._buffer) {
        this._buffer = Buffer.concat(this._writeBuffers);
    }
    this._writeBuffers = null;
    this._writeOffset = 0;
    this._readOffset = 0;
    return this._buffer;
};

AbstractObject.prototype._addWriteBuffer = function (buffer) {
    this._writeBuffers.push(buffer);
    this._writeOffset += buffer.length;
    var logger = this.constructor.logger;
    if (logger && logger.isDebugEnabled()) {
        logger.debug('Write offset %s', this._writeOffset);
    }
};

// The method writes the `int` value given as argument
AbstractObject.prototype.writeInt = function (intValue) {
    if (this.isReadonly()) {
        return false;
    }
    var buffer = new Buffer(4);
    buffer.writeUInt32LE(intValue, 0, true);
    var logger = this.constructor.logger;
    if (logger && logger.isDebugEnabled()) {
        logger.debug('intValue %s, intBuffer %s', intValue, buffer.toString('hex'));
    }
    this._addWriteBuffer(buffer);
    return true;
};

// The method writes the `BigInteger` value given as argument, you have to provide the value as `String` type
// and specify a `byte length`, where `length % 4 == 0`
AbstractObject.prototype._writeBigInt = function (bigIntegerAsString, byteLength) {
    if (this.isReadonly() || (byteLength % 4) !== 0) {
        return false;
    }
    this._addWriteBuffer(stringValue2Buffer(bigIntegerAsString, byteLength));
    return true;
};

// The method writes the `byte[]` value given as argument,
// adding the bytes length at the beginning
// and adding padding at the end if needed
AbstractObject.prototype.writeBytes = function (bytes, useWordLength) {
    if (this.isReadonly()) {
        return false;
    }
    var bLength = useWordLength ? bytes.length / 4 : bytes.length;
    var isShort = bLength < (useWordLength ? 0x7F : 0xFE);
    var buffer = new Buffer(isShort ? 1 : 4);
    var offset = 0;
    if (isShort) {
        buffer.writeUInt8(bLength, offset++);
    } else {
        buffer.writeUInt8((useWordLength ? 0x7F : 0xFE), offset++);
        buffer.writeUInt8(bLength & 0xFF, offset++);
        buffer.writeUInt8((bLength >> 8) & 0xFF, offset++);
        buffer.writeUInt8((bLength >> 16) & 0xFF, offset++);
    }
    this._addWriteBuffer(buffer);
    this._writeBytes(bytes);
    // add padding if needed
    if (!useWordLength) {
        var padding = (offset + bytes.length) % 4;
        if (padding > 0) {
            buffer = new Buffer(4 - padding);
            buffer.fill(0);
            this._addWriteBuffer(buffer);
        }
    }
    return true;
};

// The method writes the `string` value given as argument
AbstractObject.prototype.writeString = function (str) {
    return this.writeBytes(str);
};

// The method writes the `byte[]` value given as argument
AbstractObject.prototype._writeBytes = function (bytes) {
    if (this.isReadonly()) {
        return false;
    }
    var buffer = !Buffer.isBuffer(bytes) ? new Buffer(bytes) : bytes;
    this._addWriteBuffer(buffer);
    return true;
};

// The method writes the `long` value given as argument
AbstractObject.prototype.writeLong = function (bigInteger) {
    return (typeof bigInteger == 'string' || typeof bigInteger == 'number') ? this._writeBigInt(bigInteger, 8) :
        this._writeBytes(bigInteger);
};

// The method writes the `int128` value given as argument
AbstractObject.prototype.writeInt128 = function (bigInteger) {
    return (typeof bigInteger == 'string' || typeof bigInteger == 'number') ? this._writeBigInt(bigInteger, 16) :
        this._writeBytes(bigInteger);
};

// The method writes the `int256` value given as argument
AbstractObject.prototype.writeInt256 = function (bigInteger) {
    return (typeof bigInteger == 'string' || typeof bigInteger == 'number') ? this._writeBigInt(bigInteger, 32) :
        this._writeBytes(bigInteger);
};


// The method reads an `int` value starting from the current position
AbstractObject.prototype.readInt = function () {
    if (!this.isReadonly() || (this._readOffset + 4) > this._buffer.length) {
        return undefined;
    }
    var intValue =  this._buffer.readUInt32LE(this._readOffset);
    // Reading position will be increased of 4
    this._readOffset += 4;
    return intValue;
};


// The method reads a `byte[]` value starting from the current position, using the first byte(s) to get the length
AbstractObject.prototype.readBytes = function (useWordLength) {
    var start = this._readOffset;
    var bLength = this._buffer.readUInt8(this._readOffset++);
    var logger = this.constructor.logger;
    var isShort = bLength < 0x7F;
    if (!isShort) {
        bLength = this._buffer.readUInt8(this._readOffset++) +
            (this._buffer.readUInt8(this._readOffset++) << 8) +
            (this._buffer.readUInt8(this._readOffset++) << 16);
    }
    if (logger && logger.isDebugEnabled()) {
        logger.debug('bufferLength = %s', bLength);
    }
    var buffer = this._readBytes(useWordLength ? bLength * 4 : bLength);
    // consider padding if needed
    var padding = (this._readOffset - start) % 4;
    if (padding > 0) {
        this._readOffset += 4 - padding;
    }
    return buffer;
};


// The method reads a `string` value starting from the current position
AbstractObject.prototype.readString = function () {
    return this.readBytes().toString('utf8');
};


// The method reads a `byte[]` value starting from the current position
AbstractObject.prototype._readBytes = function (byteLength) {
    var end = this._readOffset + byteLength;
    if (!this.isReadonly() || end > this._buffer.length) {
        return undefined;
    }
    var buffer = this._buffer.slice(this._readOffset, end);
    this._readOffset = end;
    return buffer;
};

// The method reads a `BigInteger` value with a given byte length starting from the current position
AbstractObject.prototype._readBigInt = function (byteLength) {
    var buffer = this._readBytes(byteLength);
    return buffer ? buffer2StringValue(buffer, byteLength) : undefined;
};

// The method reads a `long` value with  starting from the current position
AbstractObject.prototype.readLong = function () {
    return this._readBigInt(8);
};

// The method reads a `int128` value with  starting from the current position
AbstractObject.prototype.readInt128 = function () {
    return this._readBigInt(16);
};

// The method reads a `int256` value with  starting from the current position
AbstractObject.prototype.readInt256 = function () {
    return this._readBigInt(32);
};

// The method checks if the object has been already serialized and then it's `readonly`
AbstractObject.prototype.isReadonly = function () {
    if (this._buffer) {
        return true;
    }
    return false;
};

// The method retrieves the current read position
AbstractObject.prototype.getReadOffset = function () {
    return this._readOffset;
};

function stringValue2Buffer(stringValue, byteLength) {
    var big = ('' + stringValue).slice(0, 2) == '0x' ? new BigInt(stringValue.slice(2), 16) : new BigInt(stringValue, 10);
    return big.toBuffer({endian: 'little', size: byteLength});
}
function buffer2StringValue(buffer, byteLength) {
    return '0x' + BigInt.fromBuffer(buffer, {endian: 'little', size: byteLength}).toString(16);
}

// Export the class
module.exports = exports = AbstractObject;
exports.stringValue2Buffer = stringValue2Buffer;
exports.buffer2StringValue = buffer2StringValue;