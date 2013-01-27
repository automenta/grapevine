if(process.env['GOSSIP_COV']) {
  var PeerState = require('../src-cov/peer_state').PeerState;
} else {
  var PeerState = require('../src/peer_state').PeerState;
}

var assert = require('chai').assert

suite('peer_state', function () {
  test('updateWithDelta should set key to value', function () {
    var ps = new PeerState();
    ps.updateWithDelta('a', 'hello', 12);
    assert.equal('hello', ps.getValue('a'));
  })
  
  test('updateWithDelta should update the max version', function () {
    var ps = new PeerState();
    ps.updateWithDelta('a', 'hello', 12);
    ps.updateWithDelta('a', 'hello', 14);
    assert.equal(14, ps.max_version_seen);
  })
  
  test('updates should trigger \'update\' event', function () {
    var ps = new PeerState();
    var n = 0;
    ps.on('update', function(k,v) {
      ++n;
      assert.equal('a', k);
      assert.equal('hello', v);
    });
    ps.updateWithDelta('a', 'hello', 12);
    assert.equal(1, n)
  })
  
  test('updateLocal should set key to value', function () {
    var ps = new PeerState();
    ps.updateLocal('a', 'hello', 12);
    assert.equal('hello', ps.getValue('a'));
  })
  
  test('updateLocal should increment the max version', function () {
    var ps = new PeerState();
    ps.updateLocal('a', 'hello');
    ps.updateLocal('a', 'hello');
    assert.equal(2, ps.max_version_seen);
  })
  
  test('deltasAfterVersion should return all deltas after a version number', function () {
    var ps = new PeerState();
    ps.updateLocal('a', 1);
    ps.updateLocal('b', 'blah');
    ps.updateLocal('a', 'super');
    assert.deepEqual([['a','super','3']], ps.deltasAfterVersion(2));
  })
})