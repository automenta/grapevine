var forEach = require('./forEach'),
    gossip = require('../')

// Create a seed peer.
var seed = gossip(9000, [], '127.0.0.1');
seed.start();

// Create 20 new peers and point them at the seed (usually this would happen in 20 separate processes)
// To prevent having a single point of failure you would probably have multiple seeds
forEach(20, function (i) {
  var g = gossip(9000 + i, ['127.0.0.1:9000'])
  g.start()
  
  g.on('update', function(peer, k, v) {
    if(k !== 'somekey') return
    console.log('%s got update from %s: %s %s', g.port, peer, k, v)
  })
})

// Add another peer which updates it's state after 15 seconds
var updater = gossip(9999, ['127.0.0.1:9000'])
updater.start()

setTimeout(function() {
  updater.setLocalState('somekey', 'somevalue')
}, 15000)