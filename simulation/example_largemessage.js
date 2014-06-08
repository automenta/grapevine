//Run with: 	DEBUG=* node simulation/example_events.js

var T = require('../lib/telepathine.js').Telepathine;


var a = new T(9000, []).start();
var b = new T(9001, [":9000"]).start();

function newLargeMessage(bytes) {
	var b = new Buffer(bytes);
	b.fill("x");
	return b.toString('utf8');
}


a.on('start', function () {

	a.know('*', function (peer, v) {
		var vsize = JSON.stringify(v).length;
		console.log(this.peer_name + " knows " + peer + "'s " + this.event + "=" + ' (' + vsize + ' bytes)');
	});
});

b.on('start', function () {
	
	var n = 150101;
	var largeMessage = newLargeMessage(n);
	console.log(b.peer_name, ' sending message of ', n, 'bytes'); 
	b.set('x', largeMessage);
	
});