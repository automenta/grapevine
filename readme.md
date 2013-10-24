# ase 

[![NPM version](https://badge.fury.io/js/ase.png)](http://badge.fury.io/js/ase)
[![Build Status](https://secure.travis-ci.org/kordon/ase.png)](http://travis-ci.org/kordon/ase)
[![Dependency Status](https://gemnasium.com/kordon/ase.png)](https://gemnasium.com/kordon/ase)
[![Coverage Status](https://coveralls.io/repos/kordon/ase/badge.png?branch=master)](https://coveralls.io/r/kordon/ase?branch=master)
[![Code Climate](https://codeclimate.com/github/kordon/ase.png)](https://codeclimate.com/github/kordon/ase)
[![Technical debt analysis](https://www.sidekickjs.com/r/kordon/ase/status_badge.svg)](https://www.sidekickjs.com/r/kordon/ase)

**ase** implements a gossip-like protocol with failure detection

## install

```bash
$ npm install ase
```

## example

```js
var ase = require('./')

var peer1 = ase(function (e) {
  if(e) throw e
  console.log('%s is listening', peer1.name)

  var peer2 = ase([peer1.name])

  setTimeout(function () {
    peer2.stop()
  }, 4000)

  setTimeout(function () {
    peer2.start()
  }, 8000)
})

peer1.on('new', function (peer) {
  console.log('new peer found in the network: %s', peer.name())
})

peer1.on('alive', function (peer) {
  console.log('%s was dead but it\'s now alive', peer.name())
  process.exit()
})

peer1.on('failed', function (peer) {
  console.log('%s just failed', peer.name())
})
```

### cli example

```sh
$ node bin/example.js
192.168.1.14:53873 started
```
```sh
$ node bin/example.js --seeds=192.168.1.14:53873
192.168.1.14:53888 started
Found: 192.168.1.14:53873
```
```sh
$ node bin/example.js --seeds=192.168.1.14:53873
192.168.1.14:53897 started
Found: 192.168.1.14:53873
Found: 192.168.1.14:53888
```

## license

 * Original [bpot/node-gossip](https://github.com/bpot/node-gossip) code is under the [MIT license](license/bpot)
 * Updates from [kordon/ase](https://github.com/kordon/ase) are under the [MIT license](license/kordon)
