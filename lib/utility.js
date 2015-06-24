//     telegram.link
//     Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//     Released under the MIT License
//     http://telegram.link

// calls a service and infers the arguments by the caller function
function callService(service, emitter, channel, callback) {
    var argsValue = Array.prototype.slice.call(Array.prototype.slice.call(arguments)[4]);
    var callerFunc = arguments.callee.caller;
    var eventName = service.name || service._name;
    var callerArgNames = _retrieveArgumentNames(callerFunc);
    var props = {};
    for(var i = 0; i < callerArgNames.length - 1; i++) {
        props[callerArgNames[i]] = argsValue[i];
    }
    if (callback) {
        emitter.once(eventName, callback);
    }
    if (emitter.isReady(true)) {
        try {
            service({
                props: props,
                channel: channel,
                callback: createEventEmitterCallback(eventName, emitter)
            });
        } catch (err) {
            emitter.emit('error', err);
        }
    }
}
function _retrieveArgumentNames(func) {
    var found = /^[\s\(]*function[^(]*\(\s*([^)]*?)\s*\)/.exec(func.toString());
    return found && found[1] ? found[1].split(/,\s*/) : [];
}

// Provides a callback function that emits the supplied event type or an error event
function createEventEmitterCallback(event, emitter) {
    return function (ex) {
        if (ex) {
            emitter.emit('error', ex);
        } else {
            var args = Array.prototype.slice.call(arguments);
            args[0] = event;
            emitter.emit.apply(emitter, args);
            if (event == 'end') {
                emitter.removeAllListeners();
            }
        }
    };
}

// Export the 'service' module
exports.callService = callService;
exports.createEventEmitterCallback = createEventEmitterCallback;