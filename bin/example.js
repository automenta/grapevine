var ase = require('../'),
    argv = require('optimist').argv

var seeds = argv.seeds ? argv.seeds.split(/\,/) : []

ase(seeds, function (e, peer) {
  if(e) throw e
  
  console.log('%s started', peer.name)
  
  peer.on('new', function (peer) {
    console.log('Found: %s', peer.name())
  })
  
  peer.on('alive', function (peer) {
    console.log('Alive: %s', peer.name())
  })
  
  peer.on('failed', function (peer) {
    console.log('Died: %s', peer.name())
  })
})