
# <img src="./telegram.link.png" width="40"/> telegram.link 
[![npm version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][coverage-image]][coverage-url] [![Climate Status][climate-image]][climate-url] [![Dependency Status][gemnasium-image]][gemnasium-url]
[![Sauce Test Status][sauce-image]][sauce-url]


###_telegram.link_ is a Telegram API library for

- **Hybrid Mobile Apps** (phone and tablet)

- **Desktop Web Apps** (standard HTML5 browsers)

- **Server-side Apps**  (i.e. a Command-Line Interface) 

**telegram.link** is an unofficial **porting in javascript** of the [Telegram Application Programming Interface](https://core.telegram.org/api).
 
**telegram.link** library enables to **write once**  a **client-application** (whole or only the communication part) that
runs both on **mobile and desktop browsers** and also on a **Node.js server**  and connect to the **Telegram data-centers**
via standard [protocol](https://core.telegram.org/mtproto) and API.


## Project Status

- [Creating an Authorization Key](https://core.telegram.org/mtproto/auth_key): completed

- [User Autorization](https://core.telegram.org/api/auth): ongoing


## Project Architecture

The whole project is split in **three modules**:
  
- **telegram.link** (this library): is the main module and provides the **highest-level interface** to communicate with the Telegram data-center. 
When you write your **_'telegram-like-app'_** you should deal only with this module.

- [**telegram-mt-node**](https://github.com/enricostara/telegram-mt-node) (dependency): implements the **Telegram Mobile Protocol** [(MTProto)](https://core.telegram.org/mtproto),
the protocol level to establish a secure communication with the Telegram cloud.

- [**telegram-tl-node**](https://github.com/enricostara/telegram-tl-node) (dependency): implements the core [**TypeLanguage types**](https://core.telegram.org/mtproto/TL) and 
a **TypeBuilder** class that writes **Type classes and functions** in pure javascript parsing TypeLanguage [schemas](https://core.telegram.org/schema). 
TypeLanguage types represent the **building blocks of the Telegram protocol**.

### Other direct dependencies

- [get-flow](https://github.com/enricostara/get-flow): just yet another Node.js flow control utility, powerful and easy to use

- [get-log](https://github.com/enricostara/get-log): a Node.js logging utility, easy to use and ready for production environment.

- [requirish](https://github.com/enricostara/requirish): a tool for avoiding the ../../../ relative paths problem, includes a
browserify-transform to rewrites the require() for browser.

## Installation

To get the complete package:
```bash
$ git clone --branch=master git://github.com/enricostara/telegram.link.git
$ cd telegram.link
$ npm install
```

To install the library as dependency for your app (no tests, no docs, no dev files.. only pure code!):
```bash
$ cd YourApp
$ npm install --save telegram.link
```

## Unit Testing 

You can run unit-test executing the following command in the project-root folder:
```bash
$ npm test
```
## Documentation

The api documentation is generated under the _docs/_ folder, parsing the main module `telegram.link.js`,
you can [browse it here](https://cdn.rawgit.com/enricostara/telegram.link/master/docs/telegram.link.html). 

### About Telegram.. 

[Telegram](http://www.telegram.org ) is a cross-platform messenger whose clients are **open source**. 
Telegram users can exchange encrypted and self-destructing messages, photos, videos and documents (all file-types supported). 
Telegram is officially available for Android and iOS (including tablets and devices without Wi-Fi). 
Unofficial clients for Windows Phone, as well as a web version, OS X version, Linux version and a Windows desktop client 
are available from independent developers using the **Telegram API**
([from Wikipedia](http://en.wikipedia.org/wiki/Telegram_\(software\))).

### About Node.JS..

[Node.js](http://nodejs.org) is a cross-platform runtime environment for server-side and networking applications. 
Node.js applications are written in JavaScript, and can be run within the Node.js runtime on OS X, Microsoft Windows and 
Linux with no changes ([from Wikipedia](http://en.wikipedia.org/wiki/Node.js)).

### About the  <img src="./telegram.link.png" width="25"/> telegram.link logo  ..

Logo crafted by [Diego Pasquali](http://dribbble.com/diegopq)

## License

The project is released under the [MIT license](./LICENSE) 


[npm-url]: https://www.npmjs.org/package/telegram.link
[npm-image]: https://badge.fury.io/js/telegram.link.svg

[travis-url]: https://travis-ci.org/enricostara/telegram.link
[travis-image]: https://travis-ci.org/enricostara/telegram.link.svg?branch=master

[climate-url]: https://codeclimate.com/github/enricostara/telegram.link
[climate-image]: https://codeclimate.com/github/enricostara/telegram.link/badges/gpa.svg

[coverage-url]: https://coveralls.io/r/enricostara/telegram.link?branch=master
[coverage-image]: https://img.shields.io/coveralls/enricostara/telegram.link.svg

[gemnasium-url]: https://gemnasium.com/enricostara/telegram.link
[gemnasium-image]: https://gemnasium.com/enricostara/telegram.link.svg

[sauce-url]: https://saucelabs.com/u/enricostara
[sauce-image]: https://saucelabs.com/browser-matrix/enricostara.svg
