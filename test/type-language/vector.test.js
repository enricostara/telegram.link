require('should');
var Vector = require('../../index').type_language.Vector;
var AbstractObject = require('../../index').type_language.AbstractObject;

describe('Vector', function () {

    describe('#init()', function () {
        it('should return an instance', function (done) {
            var list = new Vector();
            list.should.be.ok;
            list.should.be.an.instanceof(Vector);
            list.should.be.an.instanceof(AbstractObject);
            list.should.have.properties({id: '15c4b51c', type: 'Int'});
            list.isReadonly().should.be.false;

            var list = new Vector({type: 'long', buffer: new Buffer('15C4B51C01000000216BE86C022BB4C3', 'hex')});
            list.should.have.properties({id: '15c4b51c', type: 'Long'});
            list.isReadonly().should.be.true;

            var list = new Vector({type: 'long', list: [1,2,3]});
            list.should.have.properties({id: '15c4b51c', type: 'Long'});
            list.isReadonly().should.be.false;
            list.getList().should.be.eql([1,2,3]);

            done();
        })
    });

    describe('#deserialize()', function () {
        it('should de-serialize the list', function (done) {
            var list = new Vector({type: 'long', buffer: new Buffer('15C4B51C01000000216BE86C022BB4C3', 'hex')});
            list.deserialize().should.be.ok;
            list.getList().length.should.be.equal(1);
            list.getList().pop().should.be.equal('0xc3b42b026ce86b21');
            done();
        })
    });

    describe('#deserialize()', function () {
        it('should not de-serialize the list cause type id mismatch', function (done) {
            var list = new Vector({type: 'long', buffer: new Buffer('25C4B51C01000000216BE86C022BB4C3', 'hex')});
            list.deserialize().should.not.be.ok;
            done();
        })
    });

    describe('#serialize()', function () {
        it('should serialize the list', function (done) {
            var list = new Vector({type: 'long', list: ['0xc3b42b026ce86b21']});
            var buffer =  list.serialize();
            buffer.should.be.ok;
            buffer.toString('hex').should.be.equal('15c4b51c01000000216be86c022bb4c3');
            done();
        })
    });

});
