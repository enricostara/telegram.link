require('should');
require('requirish')._(module);
var telegramLink = require('lib/telegram.link');

describe('TelegramLink', function () {

    var appId = require('lib/static').telegram.test.appId;
    var primaryDC = telegramLink.TEST_PRIMARY_DC;

    describe('#createClient()', function () {
        it('should create a client', function () {
            var client = telegramLink.createClient(appId, primaryDC);
            client.should.be.ok;
            client._appId.should.equal(appId);
            (!client._authKey).should.be.true;

            client = telegramLink.createClient(appId, primaryDC, {authKey: {id: 'id'}});
            client.should.be.ok;
            client._appId.should.equal(appId);
            client._authKey.should.be.ok;
            client._authKey.id.should.be.equal('id');
        });
    });

    describe('#createClient()', function () {
        it('should callback on the HTTP connection event', function (done) {
            telegramLink.createClient(appId, primaryDC, function () {
                console.log('connected');
                done();
            });
        });
    });

    describe('#createClient()', function () {
        it('should callback on the TCP connection event', function (done) {
            var client = telegramLink.createClient(appId, primaryDC, {connectionType: 'TCP'}, function () {
                client.end(done);
            });
            client.on(telegramLink.EVENT.ERROR, function (ex) {
                console.log(ex);
                done();
            })
        });
    });

    describe('#createAuthKey()', function () {
        var auth = require('telegram-mt-node').auth;
        auth.createAuthKey = function (callback, connection) {
            setTimeout(function () {
                if (connection) {
                    callback(null, new auth.AuthKey('id', 'value', 'serverSalt'));

                } else {
                    callback(new Error('no connection'));
                }
            }, 0);
        };
        it('should returns AuthKey', function (done) {
            var client = telegramLink.createClient(appId, primaryDC, function () {
                console.log('%s connected', client);
                client.createAuthKey(function (authKey) {
                    authKey.should.be.ok;
                    console.log('Auth key OK: %s', authKey.toString());
                    client.end(done);
                });
            });
        });
        it('should returns an error', function (done) {
            var client = telegramLink.createClient(appId, primaryDC, function () {
                var conn = client._connection;
                client._connection = null;
                client.createAuthKey(function () {
                });
                client.once(telegramLink.EVENT.ERROR, function (ex) {
                    console.log('Error: %s', ex);
                    ex.should.be.ok;
                    client._connection = conn;
                    client.end(done);
                });
            });
        });
    });
});
