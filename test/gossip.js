if(process.env['CARAVEL_COV']) {
  var caravel = require('../src-cov/caravel')
} else {
  var caravel = require('../')
}

var valid_ip = function (ip) {
  if(!(/^(\d{1,3}\.){3,3}\d{1,3}$/.test(ip))) return false
  
  return ip.split('.').every(function (num) {
    return (Number(num) <= 255)
  })
}

var valid_port = function (port) {
  if(port < 49152) return false
  if(port > 65535) return false
  return true
}

var assert = require('assert')

suite('gossip')

test('new peer event', function (callback) {
  var $callback = function (peer) {
    if(!$callback.n) $callback.n = 0
    $callback.n += 1
    console.log('cal')
    if($callback.n < 2) return
    peer.close()
    callback()
  }
  
  var validate_peer = function (seed) {
    return function (peer) {
      console.log(peer)
      assert(!peer.local)
      assert(peer.seed === seed)
      assert(peer.hostname)
      assert(peer.port)
      assert(valid_ip(peer.hostname))
      assert(valid_port(peer.port))
      $callback(peer)
    }
  }
  
  caravel(function (e, peer) {
    assert(!e)
    console.log(peer)
    caravel([peer.name]).on('new', validate_peer(true))
  }).on('new', validate_peer(false))
})

test('alive peer event', function (callback) {
  var peer1 = caravel(function (e, peer) {
    assert(!e)
    
    var peer2 = caravel([peer.name])
    peer2.on('new', function () {
      peer1.stop()
    })
    
    peer2.on('failed', function () {
      console.log(arguments)
    })
  })
})

// failed

// test('#indexOf()', function(){
//   var arr = [1,2,3];
//   ok(arr.indexOf(1) == 0);
//   ok(arr.indexOf(2) == 1);
//   ok(arr.indexOf(3) == 2);
// });
//
// suite('String');
//
// test('#length', function(){
//   ok('foo'.length == 3);
// });
//
//
// suite('gossip', function () {
//   test('should emit new_peer event when we learn about a new peer', function () {
//     var g = gossip();
//     // mock scuttle
//     g.scuttle = { 'scuttle' : function(v) {
//       return { 'new_peers' : ['127.0.0.1:8010'] };
//     }} ;
//
//     var emitted = false;
//     g.on('new_peer', function() {
//       emitted = true;
//     });
//     g.firstResponseMessage({});
//     assert.ok(emitted);
//   })
//
// })