//       Telegram.link
//       Copyright 2014 Enrico Stara 'enrico.stara@gmail.com'
//       Released under the MIT license
//       http://telegram.link

//      PQFinder class
//
// This class find the `PQ pair with P < Q` starting from a `BigInteger` value

// Imports dependencies
var BigInteger = require('jsbn');

// The constructor may be called either giving a `Buffer` with the binary image or
// a `String / Number` representation of the `BigInteger` number
function PQFinder(pqNumber) {

    this.createBigIntFromNumber = function (num) {
        return new BigInteger(num.toString(16), 16);
    };
    this.createBigIntFromString = function (num) {
        return new BigInteger(num, 10);
    };
    this.createBigIntFromBuffer = function (num) {
        return new BigInteger(num);
    };
    this.nextRandom = function (max) {
        return Math.floor(Math.random() * max);
    };

    this._pqNumber = ("number" == typeof pqNumber) ? this.createBigIntFromNumber(pqNumber) :
        ("string" == typeof pqNumber) ? this.createBigIntFromString(pqNumber) : this.createBigIntFromBuffer(pqNumber);
}


// Find the pair P and Q with p < q and returns an array where `p = [0] and q = [1]`
PQFinder.prototype.findPQ = function () {

    if (!this._pq) {
        var num = this._pqNumber;
        var prime;
        for (var i = 0; i < 3; i++) {
            var q = this.createBigIntFromNumber((this.nextRandom(128) & 15) + 17);
            var x = this.createBigIntFromNumber(this.nextRandom(1000000000) + 1);
            var y = x.clone();
            var lim = 1 << (i + 18);
            for (var j = 1; j < lim; j++) {
                var a = x.clone();
                var b = x.clone();
                var c = q.clone();
                while (!b.equals(BigInteger.ZERO)) {
                    if (!b.and(BigInteger.ONE).equals(BigInteger.ZERO)) {
                        c = c.add(a);
                        if (c.compareTo(num) > 0) {
                            c = c.subtract(num);
                        }
                    }
                    a = a.add(a);
                    if (a.compareTo(num) > 0) {
                        a = a.subtract(num);
                    }
                    b = b.shiftRight(1);
                }
                x = c.clone();
                var z = x.compareTo(y) < 0 ? y.subtract(x) : x.subtract(y);
                prime = z.gcd(num);
                if (!prime.equals(BigInteger.ONE)) {
                    break;
                }
                if ((j & (j - 1)) === 0) {
                    y = x.clone();
                }
            }
            if (prime.compareTo(BigInteger.ONE) > 0) {
                break;
            }
        }
        var cofactor = num.divide(prime);
        this._pq = prime < cofactor ? [prime, cofactor] : [cofactor, prime];
    }

    return this._pq;
};

// Returns a new Buffer for each P and Q value as array
PQFinder.prototype.getPQAsBuffer = function () {
    return [new Buffer(this.findPQ()[0].toByteArray()), new Buffer(this.findPQ()[1].toByteArray())];
};

// Exports the class
module.exports = exports = PQFinder;
