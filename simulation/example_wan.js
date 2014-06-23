var T = require('../lib/telepathine.js').Telepathine;

var wanAddress   = '24.131.65.218'; //set this to your Internet IP as seen from other hosts
var lanAddress   = '192.168.0.102'; //set this to your LAN IP
var localAddress = '127.0.0.1';

//WAN
var a = new T(9999, [], {
	address: wanAddress,
	addressMap: {
		localAddress: wanAddress
	}	
}).start();

//LAN
var b = new T(9001, [wanAddress+":9999"], {
	address: lanAddress,
	addressMap: {
		localAddress: lanAddress
	}
}).start();

//Local
var c = new T(9002, [lanAddress+":9001"], {
}).start();

a.on('start', function () {
	
	var i = 0;
	setInterval(function() {	a.set('x', i++);	}, 1000);

	a.know('x', function(peer,k, d) { console.log('a recv', d, a.livePeers());	});
	
});

b.on('start', function () {

	var i = 0;
	setInterval(function() {	b.set('x', i++);	}, 1000);
	
	b.know('x', function(peer,k, d) { console.log('b recv', d, b.livePeers() );	});
	
});

b.on('start', function () {

	c.know('x', function(peer,k, d) { console.log('c recv', d, c.livePeers() );	});
	
});
