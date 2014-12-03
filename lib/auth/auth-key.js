//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     https://github.com/enricostara/telegram-mt-node

//     AuthKey class
//
// This class represents the Authentication Key

function AuthKey(id, value, serverSalt) {
    this._id = id;
    this._value = value;
    this._serverSalt = serverSalt;
}

// This method returns the id
AuthKey.prototype.getId = function () {
    return this._id;
};

// This method returns the id
AuthKey.prototype.getValue = function () {
    return this._value;
};

// This method returns the associated serverSalt
AuthKey.prototype.getServerSalt = function () {
    return this._serverSalt;
};

// This method returns the associated serverSalt
AuthKey.prototype.toString = function () {
    return '{ id:' + this._id.toString('hex') +
        ', value:' + this._value.toString('hex') +
        ', serverSalt:' + this._serverSalt.toString('hex') +
        ' }';
};

// Export the class
module.exports = exports = AuthKey;