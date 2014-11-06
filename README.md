
<img src="./telegram.link.png" width="120" />


# telegram.link 
[![npm version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coverage-image]][coverage-url] [![Dependency Status][gemnasium-image]][gemnasium-url]

This is an unofficial **javascript library** to connect to **Telegram Messanger** and write a Telegram client that runs 
on the **Node.js** platform and on a standard **web browser**.

### About Telegram Messenger.. 

[Telegram Messenger](http://www.telegram.org ) is a cross-platform messenger whose clients are **open source**. 
Telegram users can exchange encrypted and self-destructing messages, photos, videos and documents (all file-types supported). 
Telegram is officially available for Android and iOS (including tablets and devices without Wi-Fi). 
Unofficial clients for Windows Phone, as well as a web version, OS X version, Linux version and a Windows desktop client 
are available from independent developers using the **Telegram API**
([from Wikipedia](http://en.wikipedia.org/wiki/Telegram_\(software\))).

### About Node.JS..

[Node.js](http://nodejs.org) is a cross-platform runtime environment for server-side and networking applications. 
Node.js applications are written in JavaScript, and can be run within the Node.js runtime on OS X, Microsoft Windows and 
Linux with no changes ([from Wikipedia](http://en.wikipedia.org/wiki/Node.js)).


## Telegram.link project in short..

**telegram.link** is an unofficial **porting in javascript** of [Telegram-API](https://core.telegram.org/api). 
With Node.js technology and the javascript language, telegram.link enables to **write once** a Telegram-Client application 
that **runs both on a Node.js server and on a standard web browser** 
(using, in this case, a technology like [browserify](https://www.npmjs.org/package/browserify)).

## Project Status

This an **early version**, the current state of progress includes:

- A first implementation of the **Builder** class that reads [Telegram schemas](https://core.telegram.org/schema) 
and writes dynamically **javascript classes and functions** parsing [TypeLanguage](https://core.telegram.org/mtproto/TL).

- A **TCP connection** and a **HTTP connection**  based on [Telegram protocol spec](https://core.telegram.org/mtproto#tcp-transport). 

- A first [MTProto protocol](https://core.telegram.org/mtproto) implementation to 
[create an authorization key](https://core.telegram.org/mtproto/auth_key) is on going.

- A **unit-test suite** to cover them all!

## Installation

```bash
$ git clone --branch=master git://github.com/enricostara/telegram.link.git
$ cd telegram.link
$ npm install
```

## Unit Testing 

```bash
$ npm test
```

## Telegram API Integration Testing 

```bash
$ gulp integration
```

## Documentation
 
The API documentation was generated [here](./docs/api/telegram.link.html)


## License

The project is released under the [Simplified BSD license](./LICENSE) 

### About the Logo..

Logo crafted by [Diego Pasquali](http://dribbble.com/diegopq)

## That's it, check back later :)


[npm-url]: https://www.npmjs.org/package/telegram.link
[npm-image]: https://badge.fury.io/js/telegram.link.svg

[travis-url]: https://travis-ci.org/enricostara/telegram.link
[travis-image]: https://travis-ci.org/enricostara/telegram.link.svg?branch=master

[coverage-url]: https://coveralls.io/r/enricostara/telegram.link?branch=master
[coverage-image]: https://img.shields.io/coveralls/enricostara/telegram.link.svg

[gemnasium-url]: https://gemnasium.com/enricostara/telegram.link
[gemnasium-image]: https://gemnasium.com/enricostara/telegram.link.svg

