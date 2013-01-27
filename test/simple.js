if(process.env['GOSSIP_COV']) {
  var gossip = require('../src-cov/gossip').Gossiper;
} else {
  var gossip = require('../').Gossiper;
}

var assert = require('chai').assert

suite('simple', function () {
  test('basic test', function (callback) {
    var seed = new gossip(7000, []);
    seed.start();
    
    var g1 = new gossip(7001, ['127.0.0.1:7000']);
    g1.start();
    g1.setLocalState('holla','at');
    
    var g2 = new gossip(7002, ['127.0.0.1:7000']);
    g2.start();
    g2.setLocalState('your','node');
    
    setTimeout(function() {
      assert.equal('node', g1.peerValue('127.0.0.1:7002', 'your'));
      assert.equal('node', g2.peerValue('127.0.0.1:7002', 'your'));
      assert.equal('node', seed.peerValue('127.0.0.1:7002', 'your'));
      assert.equal('at', g2.peerValue('127.0.0.1:7001', 'holla'));
      seed.stop();
      g1.stop();
      g2.stop();
      callback()
    }, 10000);
  })
})