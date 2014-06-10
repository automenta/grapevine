var _ = require('lodash');
var T = require('../lib/telepathine.js').Telepathine;


var network = "Preshared_Secret_Network_Key";

//3 different networks are defined.
//  A & B will be able to share on their network, 
//  C and D will be entirely disconnected from other nodes and each other

var a = new T(9000, [], {
	network: network
}).start();
var b = new T(9001, [":9000"], {
	network: network
}).start();
var c = new T(9002, [":9001", ":9002"], {
	network: "Wrong_Key"
}).start();
var d = new T(9003, [":9001", ":9002"], {
	/* no key */
}).start();


a.on('start', function () {

	a.hearOnce('eventname', function (data, fromPeer) {
		console.log('a received eventname=', data, 'from', fromPeer);
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
c.on('start', function () {
	c.on('peer:new', function(p) {
		console.log('this should not be printed; can not access the seeded network with wrong network key');
	});	
});
d.on('start', function () {
	d.on('peer:new', function(p) {
		console.log('this should not be printed; can not access the seeded network with wrong network key');
	});	
});
			
