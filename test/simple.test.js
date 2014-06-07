var T = require('../lib/telepathine').Telepathine;

module.exports = {

	'basic test': function (beforeExit, assert) {

		var seed = new T(7000, []).start();

		var g1 = new T(7001, ['127.0.0.1:7000']).start();
		g1.set('holla', 'at');

		var g2 = new T(7002, ['127.0.0.1:7000']).start();
		g2.set('your', 'node');

		setTimeout(function () {
			seed.stop();
			g1.stop();
			g2.stop();
		}, 7000);

		beforeExit(function () {
			assert.equal('node', g1.getRemote('127.0.0.1:7002', 'your'));
			assert.equal('node', g2.getRemote('127.0.0.1:7002', 'your'));
			assert.equal('node', seed.getRemote('127.0.0.1:7002', 'your'));
			assert.equal('at', g2.getRemote('127.0.0.1:7001', 'holla'));
		});
	}

};