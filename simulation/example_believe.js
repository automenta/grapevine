//Run with: 	DEBUG=* node simulation/example_events.js

var T = require('../lib/telepathine.js').Telepathine;


var a = new T(9000, []).start();
var b = new T(9001, [":9000"]).start();

a.after(1000, function () {

	a.believe('x', function(peer, value) {
		console.error('should not get here because the value of x will not have changed');
	});

	a.set('x', 'y');


});

b.on('start', function () {
	
	console.log('b before:', b.get('x'));  //should not be available from .get()

	b.believe('x', function(peer, value) {
		console.log('b believes ', peer, ' about x=', value);
		console.log('b after:', b.get('x'), ' == ', value);  //should not be available from .get()
	});

	//TODO implement believeOnce
	
});
