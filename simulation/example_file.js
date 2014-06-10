var telepathine = require('../lib/telepathine.js');
var T = telepathine.Telepathine;


var a = new T(9000, []).start();
var b = new T(9001, [":9000"]).start();

a.on('start', function () {
	
	new telepathine.FileInput(a, "lib", { });
	
	
});

b.on('start', function () {

	b.on('set', function(peer, key, value) {
		console.log(peer, key, value.data.length + ' bytes');
	});

});


