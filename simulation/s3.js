var T = require('../lib/telepathine').Telepathine;

var seed1 = new T(9000, []).start();
var seed2 = new T(9001, []).start();

var gs = [];
var count = 100;
var peers_done = 0;

for (var p = 9101; p <= 9101 + count; p++) {
	(function (i) {

		var g = gs[i] = new T(i, [':9000', ':9001']);

		g._n = 0;
		g._finished = false;

		g.on('peer:new', function () {
			if (g._finished) return;

			g._n++;
			console.log('peer', i, 'has', g._n);

			if (g._n == count) {
				console.log('peer done');
				peers_done++;
				g._finished = true;

				if (peers_done == count) {
					console.log("all peers know about each other");
					process.exit();
				}
			}
		});

		g.start();
	})(p);
}