//For debug log, run: DEBUG=* node simulation/example_p2p.js

var T = require('../lib/telepathine.js').Telepathine;

var startPort = 9000;
var numSeeds = 4;

var seed = new T( startPort++,
				  [ /* no seeds */ ], 
				  { /* default configuration */ } 
				).start();	

// Create peers and point them at the seed 
// Usually this would happen in separate processes.
// To prevent a network's single point of failure, design with multiple seeds.
for (var i = 0; i < numSeeds; i++) {

	var g = new T(i + startPort + 1, 
				  ['127.0.0.1:' + (startPort + i + 2)]).start();

	//event emitted when a remote peer sets a key to a value
	g.on('set', function (peer, k, v) {
		console.log(this.peer_name + " knows via on('set'.. that peer " + peer + " set " + k + "=" + v);
	});
	
	//convenience method for key/value change events
	g.know('somekey', function (peer, v) {
		console.log(this.peer_name + " knows via know('somekey'.. that peer " + peer + " set somekey=" + v);
	});
	
	//convenience method for key change events, using wildcard
	g.know('*', function (peer, v) {
		console.log(this.peer_name + " knows via know('*'.. that peer " + peer + " set " + this.event + "=" + v);
	});
}


// Another peer which updates state after a delay
new T(startPort, 
      ['127.0.0.1:' + (startPort + 1)] )
		.after(1000, function () {
				
			// indefinite memory
			this.set('somekey', 'somevalue');

			// temporary memory: 10 seconds from now this key will start to expire in the gossip net
			this.set('somekey2', 'somevalue', Date.now() + 10000);
			
		}).start();