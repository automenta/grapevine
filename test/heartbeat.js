if(process.env['GOSSIP_COV']) {
  var gossip = require('../src-cov/gossip').Gossiper;
} else {
  var gossip = require('../').Gossiper;
}

var assert = require('chai').assert

suite('heartbeat', function () {
  test('heartbeat', function (callback) {
    var seed = new gossip(7000, []);
    seed.start();
    
    var g1 = new gossip(7001, ['127.0.0.1:7000']);
    g1.start();
    
    var g2 = new gossip(7002, ['127.0.0.1:7000']);
    g2.start();
    
    var dead_emitted = false;
    g2.on('peer_failed', function(peer) {
      dead_emitted = true;
      assert.equal('127.0.0.1:7001', peer);
    });
    
    var alive_emitted = false;
    g2.on('peer_alive', function(peer) {
      alive_emitted = true;
      assert.equal('127.0.0.1:7001', peer);
    });
    
    setTimeout(function() {
      console.log("stopping g1");
      g1.stop();
    }, 10000);
    
    setTimeout(function() {
      console.log("starting g1");
      g1.start();
    }, 45000);
    
    setTimeout(function() {
      g1.stop();
      seed.stop();
      g2.stop();
    }, 55000);
    
    assert.ok(dead_emitted);
    assert.ok(alive_emitted);
  })
})