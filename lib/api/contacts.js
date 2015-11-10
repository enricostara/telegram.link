//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link


// Dependencies:
var api = require('../api');
var utility = require('../utility');


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

// Export the class
module.exports = exports = Contacts;
