require('should');
var mtproto = require('../../index').mtproto;
var AbstractObject = require('../../index').type_language.AbstractObject;

describe('mtproto', function () {

    describe('PlainMessage', function () {

        describe('#init()', function () {
            it('should return an instance', function (done) {

                var msg = new mtproto.PlainMessage();
                msg.should.be.ok;
                msg.should.be.an.instanceof(mtproto.PlainMessage);
                msg.should.be.an.instanceof(AbstractObject);
                msg.isReadonly().should.be.false;

                msg = new mtproto.PlainMessage({message:  new Buffer('FFFF', 'hex')});
                msg.should.have.properties({_authKeyId: 0, _messageLength: 2});
                msg.getMessage().toString('hex').should.eql('ffff');

                msg = new mtproto.PlainMessage({buffer:  new Buffer('FFFF', 'hex')});
                msg.retrieveBuffer().toString('hex').should.eql('ffff');

                done();
            })
        });

        describe('#serialize()', function () {
            it('should serialize the msg', function (done) {
                var msg = new mtproto.PlainMessage({message:  new Buffer('FFFF', 'hex')});
                msg._messageId = 1;
                var buffer = msg.serialize();
                buffer.should.be.ok;
                buffer.toString('hex').should.be.equal('0000000000000000010000000000000002000000ffff');
                done();
            })
        });

        describe('#deserialize()', function () {
            it('should de-serialize the msg', function (done) {
                var msg = new mtproto.PlainMessage({type: 'long', buffer: new Buffer('0000000000000000010000000000000002000000ffff', 'hex')});
                msg.deserialize().should.be.ok;
                msg.getMessageId().should.be.eql(1);
                msg.getMessage().toString('hex').should.eql('ffff');
                done();
            })
        });

        /*

                describe('#deserialize()', function () {
                    it('should not de-serialize the msg cause type id mismatch', function (done) {
                        var msg = new Vector({type: 'long', buffer: new Buffer('25C4B51C01000000216BE86C022BB4C3', 'hex')});
                        msg.deserialize().should.not.be.ok;
                        done();
                    })
                });

        */

    });
});
