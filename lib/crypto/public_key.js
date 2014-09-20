//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

//      PublicKey class
//
// This class represents a Public Key

// The constructor requires the fingerprint, the key and the exponent
function PublicKey(params) {
    this._fingerprint = params.fingerprint;
    this._key = params.key;
    this._exponent = params.exponent;
}

PublicKey.prototype.getFingerprint = function () {
    return this._fingerprint;
};

PublicKey.prototype.getKey = function () {
    return this._key;
};

PublicKey.prototype.getExponent = function () {
    return this._exponent;
};

// The key store
var keyStore = {};

// Add a key to key store, it requires the fingerprint, the key and the exponent:
//
//  PublicKey.addKey{fingerprint: '...', key: '...', exponent: '...'});
//
PublicKey.addKey = function (params) {
    var newKey = new PublicKey(params);
    keyStore[newKey.getFingerprint()] = newKey;
};

// Retrieve a key with the fingerprint
PublicKey.retrieveKey = function (fingerprint) {
    return keyStore[fingerprint];
};

// Export the class
module.exports = exports = PublicKey;
