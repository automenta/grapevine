//Run with:
//	DEBUG=* node examples/p2p.js

var Gossiper = require('../lib/gossiper.js').Gossiper;

var seed = new Gossiper(9000, []).start();	// Create a seed peer.

var startPort = 9001;
var numSeeds = 4;

// Create peers and point them at the seed (usually this would happen in 20 separate processes)
// To prevent having a single point of failure you would probably have multiple seeds
for (var i = 0; i < numSeeds; i++) {

	var g = new Gossiper(i + startPort + 1, 
						 ['127.0.0.1:' + (startPort + i + 2)]).start();

	g.on('set', function (peer, k, v) {
		console.log(this.peer_name + " knows via on('set'.. that peer " + peer + " set " + k + "=" + v);
	});
	
	g.know('somekey', function (peer, v) {
		console.log(this.peer_name + " knows via know('somekey'.. that peer " + peer + " set somekey=" + v);
	});
	
	g.know('*', function (peer, v) {
		console.log(this.peer_name + " knows via know('*'.. that peer " + peer + " set " + this.event + "=" + v);
	});
}

// Add another peer which updates it's state after a delay
new Gossiper(startPort, 
			   ['127.0.0.1:' + (startPort + 1)])
		.after(1000, function () {
			// indefinite memory
			this.setLocal('somekey', 'somevalue');

			// temporary memory: 10 seconds from now this key will start to expire in the gossip net
			this.setLocal('somekey2', 'somevalue', Date.now() + 10000);
		}).start();