//       Telegram.link 0.0.1
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

require('should');
var Builder = require('../../index').type_language.Builder;
var AbstractObject = require('../../index').type_language.AbstractObject;
var Vector = require('../../index').type_language.Vector;

describe('Builder', function () {

    describe('#buildTypeConstructor({P_Q_inner_data})', function () {
        it('should return a P_Q_inner_data', function (done) {
            var P_Q_inner_data = new Builder({module: 'mtproto', tlSchema:{"id": "-2083955988", "predicate": "p_q_inner_data", "params": [
                {"name": "pq", "type": "bytes"},
                {"name": "p", "type": "bytes"},
                {"name": "q", "type": "bytes"},
                {"name": "nonce", "type": "int128"},
                {"name": "server_nonce", "type": "int128"},
                {"name": "new_nonce", "type": "int256"}
            ], "type": "P_Q_inner_data"}}).getType();
//            console.log(P_Q_inner_data.toString());
            P_Q_inner_data.should.be.an.instanceof(Function);
            var obj = new P_Q_inner_data();
            obj.should.be.an.instanceof(P_Q_inner_data);
            obj.should.be.an.instanceof(AbstractObject);
            obj.id.should.be.eql('ec5ac983');
            obj.typeName.should.be.eql('mtproto.P_q_inner_data');

            done();
        })
    });

    describe('#buildTypeConstructor({ResPQ}).deserialize()', function () {
        it('should build and de-serialize an instance of ResPQ', function (done) {
            var ResPQ = new Builder({module: 'mtproto',tlSchema: {"id": "85337187", "predicate": "resPQ", "params": [
                {"name": "nonce", "type": "int128"},
                {"name": "server_nonce", "type": "int128"},
                {"name": "pq", "type": "bytes"},
                {"name": "server_public_key_fingerprints", "type": "Vector<long>"}
            ], "type": "ResPQ"}}).getType();
//            console.log(ResPQ.toString());
            ResPQ.should.be.an.instanceof(Function);
            var obj = new ResPQ({buffer: new Buffer(
                '632416053E0549828CCA27E966B301A48FECE2FCA5CF4D33F4A11EA877BA4AA5739073300817ED48941A08F98100000015C4B51C01000000216BE86C022BB4C3',
                'hex')});
            obj.should.be.an.instanceof(ResPQ);
            obj.should.be.an.instanceof(AbstractObject);
            obj.deserialize();
//            console.log(obj);
            obj.should.have.properties({
                id: '63241605',
                typeName: 'mtproto.ResPQ',
                nonce: '0xfce2ec8fa401b366e927ca8c8249053e',
                server_nonce: '0x30739073a54aba77a81ea1f4334dcfa5'
            });
            obj.server_public_key_fingerprints.should.have.properties({
                id: '15c4b51c',
                type: 'Long',
                _list: ['0xc3b42b026ce86b21']
            });
            done();
        })
    });

    describe('#buildTypeConstructor({ResPQ}).serialize()', function () {
        it('should build and serialize an instance of ResPQ', function (done) {
            var ResPQ = new Builder({module: 'builder',tlSchema: {"id": "85337187", "predicate": "resPQ", "params": [
                {"name": "nonce", "type": "int128"},
                {"name": "server_nonce", "type": "int128"},
                {"name": "pq", "type": "bytes"},
                {"name": "server_public_key_fingerprints", "type": "Vector<long>"}
            ], "type": "ResPQ"}}).getType();

//            console.log(ResPQ.toString());

            ResPQ.should.be.an.instanceof(Function);

            var obj = new ResPQ({props: {
                nonce: '0xfce2ec8fa401b366e927ca8c8249053e',
                server_nonce: '0x30739073a54aba77a81ea1f4334dcfa5',
                pq: new Buffer('17ed48941a08f981', 'hex'),
                server_public_key_fingerprints: new Vector({type: 'long', list: ['0xc3b42b026ce86b21']})
            }
            });
            var objBuffer = obj.serialize();
            objBuffer.toString('hex').toUpperCase().should.be.
                eql('632416053E0549828CCA27E966B301A48FECE2FCA5CF4D33F4A11EA877BA4AA5739073300817ED48941A08F98100000015C4B51C01000000216BE86C022BB4C3')

            var obj2 = new ResPQ({buffer: objBuffer});
            obj2.id.should.be.eql('63241605');

            done();
        })
    });
});

