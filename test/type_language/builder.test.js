//       Telegram.link 0.0.1
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

require('should');
var Builder = require('../../index').type_language.Builder;
var AbstractObject = require('../../index').type_language.AbstractObject;

describe('Builder', function () {

    describe('#build({P_Q_inner_data})', function () {
        it('should return a P_Q_inner_data', function (done) {
            var P_Q_inner_data = Builder.build({"id": "-2083955988", "predicate": "p_q_inner_data", "params": [
                {"name": "pq", "type": "bytes"},
                {"name": "p", "type": "bytes"},
                {"name": "q", "type": "bytes"},
                {"name": "nonce", "type": "int128"},
                {"name": "server_nonce", "type": "int128"},
                {"name": "new_nonce", "type": "int256"}
            ], "type": "P_Q_inner_data"});

            console.log(P_Q_inner_data.toString());

            P_Q_inner_data.should.be.an.instanceof(Function);
            var obj = new P_Q_inner_data();
            obj.should.be.an.instanceof(P_Q_inner_data);
            obj.should.be.an.instanceof(AbstractObject);
            obj.id.should.be.eql('-2083955988');
            obj.typeName.should.be.eql('P_Q_inner_data');

            done();
        })
    });

    describe('#build({ResPQ})', function () {
        it('should return a ResPQ', function (done) {
            var ResPQ = Builder.build({"id": "85337187", "predicate": "resPQ", "params": [
                {"name": "nonce", "type": "int128"},
                {"name": "server_nonce", "type": "int128"},
                {"name": "pq", "type": "bytes"},
                {"name": "server_public_key_fingerprints", "type": "Vector<long>"}
            ], "type": "ResPQ"});

            console.log(ResPQ.toString());

            ResPQ.should.be.an.instanceof(Function);
            var obj = new ResPQ({buffer: new Buffer(
                '632416053E0549828CCA27E966B301A48FECE2FCA5CF4D33F4A11EA877BA4AA5739073300817ED48941A08F98100000015C4B51C01000000216BE86C022BB4C3',
                'hex')});
            obj.should.be.an.instanceof(ResPQ);
            obj.should.be.an.instanceof(AbstractObject);
            obj.deserialize()
            console.log(obj);
            obj.should.have.properties({
                id: '85337187',
                typeName: 'ResPQ',
                nonce: '0xfce2ec8fa401b366e927ca8c8249053e',
                server_nonce: '0x30739073a54aba77a81ea1f4334dcfa5'
            });
            obj.server_public_key_fingerprints.should.have.properties({
                id: '481674261',
                type: 'Long',
                _list: ['0xc3b42b026ce86b21']
            });

            done();
        })
    });
});

