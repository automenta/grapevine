var argv = require('optimist').argv,
    ase = require('../')


var seeds = argv.seeds ? argv.seeds.split(/\,/) : []

var peer = ase(seeds, function (e) {
  if(e) throw e
  console.log('%s started', peer.name)
})

peer.on('new', function (other) {
  console.log('Found: %s', other.name())
})

peer.on('alive', function (other) {
  console.log('Alive: %s', other.name())
})

peer.on('failed', function (other) {
  console.log('Died: %s', other.name())
})