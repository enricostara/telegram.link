//       Telegram.link 0.0.1
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

//      Builder module
//
// This module can build dynamically a `AbstractObject` concrete sub-class
// parsing `TL-Schema` for both `MTProto` and `Telegram API`

// Exports the methods
exports.build = build;

// Imports dependencies
var debug = require('debug')('telegram.link:type_language.Builder');
var util = require('util');
var AbstractObject = require('./index').AbstractObject;

// Compile a reg exp to resolve Type declaration in TL-Schema
var typeResolver = /^(\w+)(<(\w+)>)?$/;

// This function builds a new `TypeLanguage` class (an `AbstractObject` concrete sub-class) parsing the `TL-Schema`
function build(tlSchema) {
    // Start creating the body of the new Type constructor, first calling super()
    var body =
        '\tvar super_ = this.constructor.super_.bind(this);\n' +
        '\tvar opts = options ? options : {};\n' +
        '\tthis._props = opts.props;\n' +
        '\tsuper_(opts.buffer, opts.offset);\n';
    // Init fields
    body +=
        '\tthis.id = "' + tlSchema.id + '";\n' +
        '\tthis.typeName = "' + tlSchema.type + '";\n';
    // create the `deserialize()` method
    body +=
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
    /*jshint evil:true */
    // Create the new Type sub-class of AbstractObject
    var typeConstructor = new Function('options', body);
    typeConstructor.require = function(type) {
        return  require('./index')[type];
    };
    util.inherits(typeConstructor, AbstractObject);
    return typeConstructor;
}