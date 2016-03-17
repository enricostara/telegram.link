//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// Dependencies:
var api = require('../api');
var utility = require('../utility');
var tl = require('telegram-tl-node');


// ***

// This module wraps API methods required to manage the user contacts.

// See [Api Methods](https://core.telegram.org/methods#working-with-contacts)

// Access only via Client object (like client.contacts) and `contacts` instance property

function Contacts(client) {
    this.client = client;
}


// ***

// **Event: **`'method name'`

// Each of the following methods emits an event with the same name when done, an `error` event otherwise.


// ***
// contacts.**getContacts(hash, [callback])**

// Return a Promise to get the current user's contact list.

// [Click here for more details](https://core.telegram.org/method/contacts.getContacts)

// The code:
Contacts.prototype.getContacts = function (hash, callback) {
    return utility.callService(api.service.contacts.getContacts, this.client, this.client._channel, callback, arguments);
};

// ***
// contacts.**importContacts(contacts, replace, [callback])**

// Return a Promise. Imports contacts: saves a full list on the server, adds already registered contacts to the contact list, returns added contacts and their info.

// [Click here for more details](https://core.telegram.org/method/contacts.importContacts)

// The code:
Contacts.prototype.importContacts = function (contacts, replace, callback) {

    contacts = new tl.TypeVector({
        type: 'InputContact',
        list: contacts.map(function (item) {

            return new api.type.InputPhoneContact({props: item});
        })
    });

    replace = !!replace === false
        ? new api.type.BoolFalse()
        : new api.type.BoolTrue();

    return utility.callService(api.service.contacts.importContacts, this.client, this.client._channel, callback, arguments);
};

// Export the class
module.exports = exports = Contacts;
