if(process.env['GOSSIP_COV']) {
  var PeerState = require('../src-cov/peer_state').PeerState;
  var gossip = require('../src-cov/gossip').Gossiper;
} else {
  var PeerState = require('../src/peer_state').PeerState;
  var gossip = require('../').Gossiper;
}

var assert = require('chai').assert

suite('gossip', function () {
  test('should be able to set and retrieve local state', function () {
    var g = new gossip();
    g.setLocalState('hi', 'hello');
    assert.equal('hello', g.getLocalState('hi'));
  })
  
  test('should be able to get a list of keys for a peer', function () {
    var g = new gossip();
    g.peers['p1'] = new PeerState();
    g.peers['p1'].attrs['keyz'] = [];
    g.peers['p1'].attrs['keyzy'] = [];
    assert.deepEqual(['keyz','keyzy'], g.peerKeys('p1'));
  })
  
  test('should be able to get the value of a key for a peer', function () {
    var g = new gossip();
    g.peers['p1'] = new PeerState();
    g.peers['p1'].attrs['keyz'] = ['hi', 1];
    assert.equal('hi', g.peerValue('p1','keyz'));
  })
  
  test('should be able to get a list of peers', function () {
    var g = new gossip();
    g.peers['p1'] = new PeerState();
    g.peers['p2'] = new PeerState();
    assert.deepEqual(['p1','p2'], g.allPeers());
  })
  
  test('should emit new_peer event when we learn about a new peer', function () {
    var g = new gossip();
    // mock scuttle
    g.scuttle = { 'scuttle' : function(v) {
      return { 'new_peers' : ['127.0.0.1:8010'] };
    }} ;
    
    var emitted = false;
    g.on('new_peer', function() {
      emitted = true;
    });
    g.firstResponseMessage({});
    assert.ok(emitted);
  })
  
  test('should emit update event when we learn more about a peer', function () {
    var g = new gossip();
    g.peers['127.0.0.1:8010'] = new PeerState();
    g.handleNewPeers(['127.0.0.1:8010']);
    var update = null;
    g.on('update', function(peer,k,v) {
     update = [peer,k,v];
    });
    g.peers['127.0.0.1:8010'].updateLocal('howdy', 'yall');
    assert.deepEqual(['127.0.0.1:8010', 'howdy', 'yall'], update);
  })
})