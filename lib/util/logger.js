//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

//      Logger class
//
// This class is the Logger utility and it supports the following levels: ERROR, WARN, INFO and DEBUG.
// The ERROR, WARN, INFO levels are always on, DEBUG can be enabled/disabled with 'DEBUG' environment var.
// For example, to enable debug for all the library modules you can set: 'DEBUG=telegram.link:*'

// Import dependencies
var debug = require('debug');
require('colors');
var appName = require('../../package.json').name;

// The constructor requires the logger name
function Logger(name) {
    this.name = appName + ':' + name;
    this._debug = debug(this.name);
    this._debug.log = function () {
        var args = arguments;
        args[0] = '[DEBUG] '.green + args[0];
        console.log.apply(console, args);
    };
    this.debugEnabled = debug.enabled(this.name);
    if (this.debugEnabled) {
        console.log('[%s] debug is %s', this.name.blue, 'ENABLED'.green);
    }
}

// Log ERROR message in std err, cannot be disabled
Logger.prototype.error = function () {
    var args = arguments;
    args[0] = '[ERROR] ' + new Date().toUTCString() + ' ' +
        this.name + ' ' + args[0];
    console.error.apply(this, args);
};

// Log WARN message in std out, cannot be disabled
Logger.prototype.warn = function () {
    var args = arguments;
    args[0] = '[WARN] '.magenta + new Date().toUTCString() + ' ' +
        this.name + ' ' + args[0];
    console.log.apply(this, args);
};

// Log INFO message in std out, cannot be disabled
Logger.prototype.info = function () {
    var args = arguments;
    args[0] = '[INFO] '.blue + new Date().toUTCString() + ' ' +
        this.name + ' ' + args[0];
    console.log.apply(this, args);
};

// Log DEBUG message in std out, CAN be disabled/enabled
Logger.prototype.debug = function () {
    if (this.isDebugEnabled()) {
        this._debug.apply(this, arguments);
    }
};

// Check if debug is enabled
Logger.prototype.isDebugEnabled = function () {
    return this.debugEnabled;
};

// Loggers cache
var loggers = {};

// Export the class
module.exports = exports = function (name) {
    return loggers[name] || (loggers[name] = new Logger(name));
};
