require('should');
require('requirish')._(module);
var telegramLink = require('lib/telegram.link');

var appId = require('lib/static').telegram.test.appId;
var primaryDC = telegramLink.TEST_PRIMARY_DC;

describe('#createAuthKey()', function () {
    it('should returns AuthKey using a HTTP connection', function (done) {
        var client = telegramLink.createClient(appId, primaryDC, function () {
            console.log('%s connected', client);
            client.createAuthKey(function (authKey) {
                authKey.should.be.ok;
                console.log('Auth key OK: %s', authKey.toString());
                client.end();
                done();
            });
            client.once(telegramLink.EVENT.ERROR, function (ex) {
                console.log('Auth key KO: %s', ex);
                (!ex).should.be.true;
                client.end();
                done();
            });
        });
    });
});

describe('#createAuthKey()', function () {
    it('should returns AuthKey using a TCP connection', function (done) {
        var client = telegramLink.createClient(appId, primaryDC, {connectionType: 'TCP'}, function () {
            console.log('%s connected', client);
            client.createAuthKey(function (authKey) {
                authKey.should.be.ok;
                console.log('Auth key OK: %s', authKey.toString());
                client.end();
                done();
            });
            client.once(telegramLink.EVENT.ERROR, function (ex) {
                console.log('Auth key KO: %s', ex);
                (!ex).should.be.true;
                client.end();
                done();
            });
        });
    });
});



