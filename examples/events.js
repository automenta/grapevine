//Run with:
//	DEBUG=* node examples/events.js

var Gossiper = require('../lib/gossiper.js').Gossiper;


var a = new Gossiper(9000, []).start();
var b = new Gossiper(9001, [":9000"]).start();

a.on('start', function() {
	
	a.hearOnce('eventname', function(data, fromPeer) {
		
		console.log('a received eventname=', data, 'from', fromPeer);
		
		a.say('reply');
		
	});
	
	a.hear('*', function(data, fromPeer) {
		
		console.log('a received ', this.event, '=', data, 'from', fromPeer);
	
	});
	
});

b.on('start', function() {
	
	b.say('eventname', 'eventdata');
	
	b.hearOnce('reply', function(data, fromPeer) {
		
		console.log('b received reply=', data, ' from ', fromPeer);
		
	});
	
});