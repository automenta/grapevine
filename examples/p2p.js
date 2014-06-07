//Run with:
//	DEBUG=* node examples/p2p.js

var Gossiper = require('../lib/gossiper.js').Gossiper;
// Create a seed peer.
var seed = new Gossiper(9000, []);
seed.start();

var startPort = 9001;
var numSeeds = 4;

// Create peers and point them at the seed (usually this would happen in 20 separate processes)
// To prevent having a single point of failure you would probably have multiple seeds
for (var i = 0; i < numSeeds; i++) {
	//For IPv6 peers use the format [ad:dre::ss]:port. e.g. [::1]:9000

	var g = new Gossiper(i + startPort + 1, ['127.0.0.1:' + (startPort + i + 2)]);
	g.start();

	g.on('update', function (peer, k, v) {
		console.log(this.peer_name + " knows peer " + peer + " set " + k + " to " + v);
	});
}

// Add another peer which updates it's state after 15 seconds
var updater = new Gossiper(startPort, ['127.0.0.1:' + (startPort + 1)]);
updater.start();

setTimeout(function () {
	updater.setLocalState('somekey', 'somevalue');

	// with ttl
	// 10 seconds from now this key will start to expire in the gossip net
	updater.setLocalState('somekey2', 'somevalue', Date.now() + 10000);
}, 1000);

