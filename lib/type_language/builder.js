//       telegram.link
//
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

//      Builder module
//
// This module can build dynamically a `AbstractObject` concrete sub-class
// parsing `TL-Schema` for both `MTProto` and `Telegram API`

// Export the methods
exports.buildType = buildType;
exports.buildTypes = buildTypes;

// Import dependencies
var util = require('util');
var AbstractObject = require('./index').AbstractObject;

// Compile a reg exp to resolve Type declaration in TL-Schema
var typeResolver = /^(\w+)(<(\w+)>)?$/;

// This function builds a new `TypeLanguage` class (an `AbstractObject` concrete sub-class) parsing the `TL-Schema`
function buildType(tlSchema) {
    // Start creating the body of the new Type constructor, first calling super()
    var body =
        '\tvar super_ = this.constructor.super_.bind(this);\n' +
        '\tvar opts = options ? options : {};\n' +
        '\tthis.constructor.util._extend(this, opts.props);\n' +
        '\tsuper_(opts.buffer, opts.offset);\n';
    // Init fields
    body +=
        '\tthis.id = "' + tlSchema.id + '";\n' +
        '\tthis.typeName = "' + tlSchema.type + '";\n';

    body += _buildSerialize(tlSchema);

    body += _buildDeserialize(tlSchema);

    /*jshint evil:true */
    // Create the new Type sub-class of AbstractObject
    var typeConstructor = new Function('options', body);
    typeConstructor.require = function (type) {
        return  require('./index')[type];
    };
    typeConstructor.util = require('util');
    util.inherits(typeConstructor, AbstractObject);
    return typeConstructor;
}

// create the `serialize()` method
function _buildSerialize(tlSchema) {
    var body =
        '\tthis.serialize = function () {\n' +
        '\t\tvar super_serialize = this.constructor.super_.prototype.serialize.bind(this);\n' +
        '\t\tif (!super_serialize()) {\n' +
        '\t\t\treturn false;\n' +
        '\t\t}\n';
    // Parse the `TL-Schema params`
    if (tlSchema.params) {
        for (var i = 0; i < tlSchema.params.length; i++) {
            var param = tlSchema.params[i];
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
                body += '\t\tthis.write' + typeName + '(this.' + param.name + ');\n';
            }
        }
    }
    body +=
        '\t\treturn this.retrieveBuffer();\n' +
        '\t}\n';
    return body;
}

// create the `deserialize()` method
function _buildDeserialize(tlSchema) {
    var body =
        '\tthis.deserialize = function () {\n' +
        '\t\tvar super_deserialize = this.constructor.super_.prototype.deserialize.bind(this);\n' +
        '\t\tif (!super_deserialize()) {\n' +
        '\t\t\treturn false;\n' +
        '\t\t}\n';
    // Parse the `TL-Schema params`
    if (tlSchema.params) {
        for (var i = 0; i < tlSchema.params.length; i++) {
            var param = tlSchema.params[i];
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
                    body += '\t\tthis.' + param.name + ' = this.read' + typeName + '();\n';
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
        '\t}';
    return body;
}

// Types builder
function buildTypes(schemas, types, targetModule, isMethodType) {
    for (var i = 0; i < schemas.length; i++) {
        var type = schemas[i];
        if (types.lastIndexOf(type[isMethodType ? 'method' : 'type']) >= 0) {
            var typeName = isMethodType ? '_' + type.method : type.type;
            targetModule[typeName] = buildType(type);
        }
    }
}