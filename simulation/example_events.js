//Run with: 	DEBUG=* node simulation/example_events.js

var T = require('../lib/telepathine.js').Telepathine;


var a = new T(9000, []).start();
var b = new T(9001, [":9000"]).start();

a.on('start', function () {

	a.hearOnce('eventname', function (data, fromPeer) {
		console.log('a received eventname=', data, 'from', fromPeer, ' ...replying');
		a.say('reply');
	});

	a.hear('*', function (data, fromPeer) {
		console.log('a received ', this.event, '=', data, 'from', fromPeer);
	});

});

b.on('start', function () {
	
	b.hearOnce('reply', function (data, fromPeer) {
		console.log('b received reply=', data, ' from ', fromPeer);
	});		

	b.say('eventname', 'eventdata');
	
});
