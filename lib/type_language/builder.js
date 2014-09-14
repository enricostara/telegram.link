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

// Import dependencies
var util = require('util');
var createLogger = require('../util/logger');
var logger = createLogger('type_language.Builder');
var AbstractObject = require('./index').AbstractObject;


// Compile a reg exp to resolve Type declaration in TL-Schema
var typeResolver = /^(\w+)(<(\w+)>)?$/;


function Builder(options) {
    this.tlSchema = options.tlSchema;
    if (!this.tlSchema) {
        logger.warn('\'tlSchema\' parameter is mandatory!');
        return;
    }
    this.isFunction = options.isFunction;
    this._methods = [];
    if (this.isFunction) {
        this._type = this.buildTypeFunction();
    } else {
        this._type = this.buildTypeConstructor();
    }
}

// Return the built type
Builder.prototype.getType = function () {
    return this._type;
};

// This function builds a new `TypeLanguage` function parsing the `TL-Schema method`
Builder.prototype.buildTypeFunction = function () {
    // Start creating the body of the new Type function
    var body =
        '\tvar conn = options.conn;\n' +
        '\tif (!conn) {\n' +
        '\t\tthis.logger.warn(\'The \\\'conn\\\' option is missing, connection is mandatory\');\n' +
        '\t\treturn;\n' +
        '\t}\n';

    /*jshint evil:true */
    // Create the new Type function
    var typeFunction = new Function('options', body);
    typeFunction.logger = createLogger('mtproto.' + this.tlSchema.method);
    return typeFunction;
};

// This function builds a new `TypeLanguage` class (an `AbstractObject` concrete sub-class)
// parsing the `TL-Schema constructor`
Builder.prototype.buildTypeConstructor = function () {

    var typeNameProperty = (this.isFunction ? 'method' : 'type');

    // Start creating the body of the new Type constructor, first calling super()
    var body =
        '\tvar super_ = this.constructor.super_.bind(this);\n' +
        '\tvar opts = options ? options : {};\n' +
        '\tthis.constructor.util._extend(this, opts.props);\n' +
        '\tsuper_(opts.buffer, opts.offset);\n';
    // Init fields
    body +=
        '\tthis.id = "' + this.tlSchema.id + '";\n' +
        '\tthis.typeName = "' + this.tlSchema[typeNameProperty] + '";\n';

    body += this._buildSerialize();

    body += this._buildDeserialize();

    for (var i = 0; i < this._methods.length; i++) {
        body += this._methods[i];
    }

    /*jshint evil:true */
    // Create the new Type sub-class of AbstractObject
    var typeConstructor = new Function('options', body);
    typeConstructor.require = function (type) {
        return  require('./index')[type];
    };
    typeConstructor.util = require('util');
    typeConstructor.logger = createLogger('mtproto.' + this.tlSchema[typeNameProperty]);
    util.inherits(typeConstructor, AbstractObject);
    return typeConstructor;
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
        '\t\tthis.constructor.logger.debug(\'write \\\'%s\\\' = %s\', \'' + propertyName + '\', this.' + propertyName + ');\n';
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
    var functionName = 'read' + propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
    var body =
        '\tthis.' + functionName + ' = function ' + functionName + '() {\n';
    body +=
        '\t\tthis.' + propertyName + ' = this.read' + typeName + '();\n';
    body +=
        '\t\tthis.constructor.logger.debug(\'read \\\'%s\\\' = %s\', \'' + propertyName + '\', this.' + propertyName + ');\n';
    body +=
        '\t};\n';
    this._methods.push(body);
    return functionName;
};

// Types builder
function buildTypes(schemas, types, targetModule, isMethodType) {
    for (var i = 0; i < schemas.length; i++) {
        var type = schemas[i];
        if (types.lastIndexOf(type[isMethodType ? 'method' : 'type']) >= 0) {
            var typeName = isMethodType ? '_' + type.method : type.type;
            targetModule[typeName] = new Builder({tlSchema: type}).getType();
        }
    }
}