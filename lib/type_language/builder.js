//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

//      Builder class
//
// This class can build dynamically a `AbstractObject` concrete sub-class
// parsing `TL-Schema` for both `MTProto` and `Telegram API`

// Export the class
module.exports = exports = Builder;

// Export the method
exports.buildTypes = buildTypes;
exports.registerType = registerType;
exports.retrieveType = retrieveType;

// Import dependencies
var util = require('util');
var createLogger = require('../util/logger');
var logger = createLogger('type_language.Builder');
var AbstractObject = require('./index').AbstractObject;

// type register

var types = {};

// Compile a reg exp to resolve Type declaration in TL-Schema
var typeResolver = /^(\w+)(<(\w+)>)?$/;

function Builder(options) {
    this.module = options.module;
    if (!this.module) {
        logger.warn(' Target \'module\' parameter is mandatory!');
        console.trace();
        return;
    }
    this.tlSchema = options.tlSchema;
    if (!this.tlSchema) {
        logger.warn('\'tlSchema\' parameter is mandatory!');
        return;
    }
    this._methods = [];

    // Check if is required creating a function
    if (options.buildFunction) {
        this._type = this.buildTypeFunction();
    } else {
        this._type = this.buildTypeConstructor();
    }
}

// Return the built type
Builder.prototype.getType = function () {
    return this._type;
};

// Return the type function payload if expected
Builder.prototype.getFunctionPayload = function () {
    return this._functionPayload;
};

// Return the required internal module/class
Builder.prototype.require = function (module) {
    var required = require('./index')[module];
    return  required;
};

// Return the required internal module/class
Builder.prototype.requireFromRoot = function (module) {
    var modulePath = module.replace(/\./.g, '/');
    var required = require('../' + modulePath);
    return  required;
};

// This function builds a new `TypeLanguage` function parsing the `TL-Schema method`
Builder.prototype.buildTypeFunction = function () {
    var methodName = this.tlSchema.method;
    // If needed, create the function payload class re-calling Builder constructor.
    this._functionPayload = new Builder({module: this.module, tlSchema: this.tlSchema}).getType();

    // Start creating the body of the new Type function
    var body =
        '\tvar conn = options.conn;\n' +
        '\tif (!conn) {\n' +
        '\t\tthis.logger.warn(\'The \\\'conn\\\' option is missing, it\\\'s mandatory\');\n' +
        '\t\treturn;\n' +
        '\t}\n';
    body +=
        '\tvar callback = options.callback;\n' +
        '\tvar errorback = options.errorback;\n' +
        '\tvar mtproto = arguments.callee.require(\'mtproto\');\n' +
        '\tvar type_language = arguments.callee.require(\'type_language\');\n' +
        '\tvar module = arguments.callee.require(\'' + this.module + '\');\n';
    body +=
        '\tvar reqPayload = new module._' + methodName + '(options);\n' +
        '\tvar reqMsg = new mtproto.PlainMessage({message: reqPayload.serialize()});\n';
    body +=
        '\tconn.connect(function () {\n' +
        '\t\tconn.write(reqMsg.serialize(), function () {\n' +
        '\t\t\tconn.read(function (response) {\n' +
        '\t\t\t\tvar resMsg = new mtproto.PlainMessage({buffer: response}).deserialize();\n' +
        '\t\t\t\tresMsg = resMsg.getMessage();\n' +
        '\t\t\t\tvar Type = type_language.Builder.retrieveType(resMsg);\n' +
        '\t\t\t\tvar resObj = new Type({buffer: resMsg});\n' +
        '\t\t\t\tcallback(resObj.deserialize());\n' +
        '\t\t\t}, errorback);\n' +
        '\t\t}, errorback);\n' +
        '\t});';
    if (logger.isDebugEnabled()) {
        logger.debug('Body for %s type function:', methodName);
        logger.debug('\n' + body);
    }
    /*jshint evil:true */
    // Create the new Type function
    var typeFunction = new Function('options', body);
    typeFunction.require = this.requireFromRoot;
    typeFunction.logger = createLogger(this.module + '.' + methodName);
    return typeFunction;
};

// This function builds a new `TypeLanguage` class (an `AbstractObject` concrete sub-class)
// parsing the `TL-Schema constructor`
Builder.prototype.buildTypeConstructor = function () {
    // Start creating the body of the new Type constructor, first calling super()
    var body =
        '\tvar super_ = this.constructor.super_.bind(this);\n' +
        '\tvar opts = options ? options : {};\n' +
        '\tthis.constructor.util._extend(this, opts.props);\n' +
        '\tsuper_(opts.buffer, opts.offset);\n';
    // Init fields
    var typeName = this.tlSchema.method ?
        this.tlSchema.method :
        (this.tlSchema.predicate.charAt(0).toUpperCase() + this.tlSchema.predicate.slice(1));

    var buffer = new Buffer(4);
    buffer.writeUInt32LE(this.tlSchema.id, 0, true);
    var typeId = buffer.toString('hex');
    var fullTypeName = this.module + '.' + typeName;
    body +=
        '\tthis.id = "' + typeId + '";\n' +
        '\tthis.typeName = "' + fullTypeName + '";\n';
    body += this._buildSerialize();
    body += this._buildDeserialize();
    // Add to body all the read/write methods
    for (var i = 0; i < this._methods.length; i++) {
        body += this._methods[i];
    }
    if (logger.isDebugEnabled()) {
        logger.debug('Body for %s type constructor:', typeName);
        logger.debug('\n' + body);
    }
    /*jshint evil:true */
    // Create the new Type sub-class of AbstractObject
    var typeConstructor = new Function('options', body);
    typeConstructor.id = typeId;
    typeConstructor.typeName = fullTypeName;
    typeConstructor.require = this.require;
    typeConstructor.util = require('util');
    typeConstructor.logger = createLogger(fullTypeName);
    util.inherits(typeConstructor, AbstractObject);
    return registerType(typeConstructor);
};

// Create the `serialize()` method
Builder.prototype._buildSerialize = function () {
    var body =
        '\tthis.serialize = function serialize () {\n' +
        '\t\tvar super_serialize = this.constructor.super_.prototype.serialize.bind(this);\n' +
        '\t\tif (!super_serialize()) {\n' +
        '\t\t\treturn false;\n' +
        '\t\t}\n';
    // Parse the `TL-Schema params`
    if (this.tlSchema.params) {
        for (var i = 0; i < this.tlSchema.params.length; i++) {
            var param = this.tlSchema.params[i];
            var type = param.type.match(typeResolver);
            var typeName = type[1];
            // Manage Object type
            if (typeName.charAt(0) == typeName.charAt(0).toUpperCase()) {
                body +=
                    '\t\tthis._writeBytes(this.' + param.name + '.serialize());\n';
            }
            // Manage primitive type
            else {
                typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
                body +=
                    '\t\tthis.' + this._buildWriteProperty(param.name, typeName) + '();\n';
            }
        }
    }
    body +=
        '\t\treturn this.retrieveBuffer();\n' +
        '\t}\n';
    return body;
};

// Create the `write[property]()` method
Builder.prototype._buildWriteProperty = function (propertyName, typeName) {
    var functionName = 'write' + propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
    var body =
        '\tthis.' + functionName + ' = function ' + functionName + '() {\n';
    body +=
        '\t\tthis.constructor.logger.debug(\'write \\\'%s\\\' = %s\', \'' + propertyName + '\', this.' + propertyName +
        ('Bytes' == typeName ? '.toString(\'hex\')' : '') + ');\n';
    body +=
        '\t\tthis.write' + typeName + '(this.' + propertyName + ');\n';
    body +=
        '\t};\n';
    this._methods.push(body);
    return functionName;
};

// create the `deserialize()` method
Builder.prototype._buildDeserialize = function () {
    var body =
        '\tthis.deserialize = function deserialize () {\n' +
        '\t\tvar super_deserialize = this.constructor.super_.prototype.deserialize.bind(this);\n' +
        '\t\tif (!super_deserialize()) {\n' +
        '\t\t\treturn false;\n' +
        '\t\t}\n';
    // Parse the `TL-Schema params`
    if (this.tlSchema.params) {
        for (var i = 0; i < this.tlSchema.params.length; i++) {
            var param = this.tlSchema.params[i];
            var type = param.type.match(typeResolver);
            var typeName = type[1];
            if (!type[3]) {
                // Manage Object type
                if (typeName.charAt(0) == typeName.charAt(0).toUpperCase()) {
                    body +=
                        '\t\tvar ' + typeName + ' = this.constructor.require(\'' + typeName + '\');\n' +
                        '\t\tvar obj = new ' + typeName + '({buffer: this._buffer, offset: this.getReadOffset()}).deserialize();\n' +
                        '\t\tif (obj) {\n' +
                        '\t\t\tthis.' + param.name + ' = obj;\n' +
                        '\t\t\tthis._readOffset = obj.getReadOffset()\n' +
                        '\t\t}\n';
                }
                // Manage primitive type
                else {
                    typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
                    body +=
                        '\t\tthis.' + this._buildReadProperty(param.name, typeName) + '();\n';
                }
            }
            // Manage generic type
            else {
                var typeParam = type[3];
                body +=
                    '\t\tvar ' + typeName + ' = this.constructor.require(\'' + typeName + '\');\n' +
                    '\t\tvar obj = new ' + typeName + '({type: \'' + typeParam + '\', ' +
                    'buffer: this._buffer, offset: this.getReadOffset()}).deserialize();\n' +
                    '\t\tif (obj) {\n' +
                    '\t\t\tthis.' + param.name + ' = obj;\n' +
                    '\t\t\tthis._readOffset = obj.getReadOffset();\n' +
                    '\t\t}\n';
            }
        }
    }
    body +=
        '\t\treturn this;\n' +
        '\t}\n';
    return body;
};

// Create the `read[property]()` method
Builder.prototype._buildReadProperty = function (propertyName, typeName) {
    var functionName = 'read' + (propertyName.charAt(0).toUpperCase() + propertyName.slice(1));
    var body =
        '\tthis.' + functionName + ' = function ' + functionName + '() {\n';
    body +=
        '\t\tthis.' + propertyName + ' = this.read' + typeName + '();\n';
    body +=
        '\t\tthis.constructor.logger.debug(\'read \\\'%s\\\' = %s\', \'' + propertyName + '\', this.' + propertyName +
        ('Bytes' == typeName ? '.toString(\'hex\')' : '') + ');\n';
    body +=
        '\t};\n';
    this._methods.push(body);
    return functionName;
};


// Register a Type constructor
function registerType(type) {
    if(logger.isDebugEnabled()) logger.debug('Register Type \'%s\' with id [%s]', type.typeName, type.id);
    return (types[type.id] = type);
}

// Retrieve a Type constructor
function retrieveType(buffer) {
    var typeId = buffer.slice(0,4).toString('hex');
    var type = types[typeId];
    if(logger.isDebugEnabled()) logger.debug('Retrive Type \'%s\' with id [%s]', type.typeName, typeId);
    return type;
}


// Types builder
function buildTypes(schemas, types, targetModule, isMethodType) {
    for (var i = 0; i < schemas.length; i++) {
        var type = schemas[i];
        if (types.lastIndexOf(type[isMethodType ? 'method' : 'type']) >= 0) {
            var typeName = isMethodType ? type.method : (type.predicate.charAt(0).toUpperCase() + type.predicate.slice(1));
            var builder = new Builder({module: 'mtproto', tlSchema: type, buildFunction: isMethodType});
            targetModule[typeName] = builder.getType();
            targetModule['_' + typeName] = builder.getFunctionPayload();
        }
    }
}