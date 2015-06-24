//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// Dependencies:
var api = require('./api');
var utility = require('./utility');


// ***

// This module wraps API methods required to the user to gain the authorization,
// see [User Authorization](https://core.telegram.org/api/auth)
// Access only via Client object and **auth** instance property

function Auth(client) {
    this.client = client;
}


// ***

// **Event: 'methodName'**
// Each of the following methods emits an event with the same name when done, an 'error' event otherwise.


// ***
// auth.**sendCode(phoneNumber, [callback])**

// Sends a text message with the confirmation code required for registration to the given phone number

// The code:
Auth.prototype.sendCode = function (phoneNumber, callback) {
    if (callback) {
        this.client.once('sendCode', callback);
    }
    var props = {
        phone_number: phoneNumber,
        sms_type: 5,
        api_id: this.client._app.id,
        api_hash: this.client._app.hash,
        lang_code: 'en'
    };
    if (this.client.isReady(true)) {
        try {
            api.service.auth.sendCode({
                props: props,
                channel: this.client._channel,
                callback: utility.createEventEmitterCallback('sendCode', this.client)
            });
        } catch (err) {
            this.client.emit('error', err);
        }
    }
};


// ***
// auth.**sendCall(phone_number, phone_code_hash, [callback])**

// Makes a voice call to the passed phone number. A robot will repeat the confirmation code from a previously sent SMS message

// The code:
Auth.prototype.sendCall = function (phone_number, phone_code_hash, callback) {
    utility.callService(api.service.auth.sendCall, this.client, this.client._channel, callback, arguments);
};


// ***
// auth.**signIn(phone_number, phone_code_hash, phone_code, [callback])**

// Signs in a user with a validated phone number

// The code:
Auth.prototype.signIn = function (phone_number, phone_code_hash, phone_code, callback) {
    utility.callService(api.service.auth.signIn, this.client, this.client._channel, callback, arguments);
};


// ***
// auth.**signUp(phone_number, phone_code_hash, phone_code, first_name, last_name, [callback])**

// Registers a validated phone number in the system

// The code:
Auth.prototype.signUp = function (phone_number, phone_code_hash, phone_code, first_name, last_name, callback) {
    utility.callService(api.service.auth.signUp, this.client, this.client._channel, callback, arguments);
};

// ***
// auth.**checkPhone(phone_number, [callback])**

// Returns information on whether the passed phone number was registered

// The code:
Auth.prototype.checkPhone = function (phoneNumber, callback) {
    utility.callService(api.service.auth.checkPhone, this.client, this.client._channel, callback, arguments);
};



module.exports = exports = Auth;