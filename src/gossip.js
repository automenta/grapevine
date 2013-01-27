var PeerState     = require('./peer_state').PeerState,
    Scuttle       = require('./scuttle').Scuttle,
    EventEmitter  = require('events').EventEmitter,
    net           = require('net'),
    util          = require('util'),
    os            = require('os'),
    dns           = require('dns'),
    msgpack       = require('msgpack2');

var gossip = function(port, seeds, ip_to_bind) {
  EventEmitter.call(this);
  this.peers    = {};
  this.ip_to_bind     = ip_to_bind;
  this.port     = port;
  this.seeds    = seeds;
  this.my_state = new PeerState();
  this.scuttle  = new Scuttle(this.peers, this.my_state);

  this.handleNewPeers(seeds);
}

util.inherits(gossip, EventEmitter);

module.exports = function (port, seeds, ip_to_bind) {
  return new gossip(port, seeds, ip_to_bind)
}


gossip.prototype.start = function(callback) {
  var self = this;

  // Create Server
  this.server = net.createServer(function (net_stream) {
    var mp_stream = new msgpack.Stream(net_stream);
    mp_stream.on('msg', function(msg) { self.handleMessage(net_stream, mp_stream, msg) });
  });

  // Bind to ip/port
  if(this.ip_to_bind) {
    this.peer_name    = [this.address, this.port.toString()].join(':');
    this.peers[this.peer_name] = this.my_state;
    this.my_state.name = this.peer_name;
    this.server.listen(this.port, this.ip_to_bind, callback);
  } else {
    // this is an ugly hack to get the hostname of the local machine
    // we don't listen on any ip because it's important that we listen
    // on the same ip that the server identifies itself as
    dns.lookup(os.hostname(), 4, function(err,address, family) {
      self.peer_name    = [address, self.port.toString()].join(':');
      self.peers[self.peer_name] = self.my_state;
      self.my_state.name = self.peer_name;
      self.server.listen(self.port, address, callback);
    });
  }

  this.handleNewPeers(this.seeds);
  this.heartBeatTimer = setInterval(function() { self.my_state.beatHeart() }, 1000 );
  this.gossipTimer = setInterval(function() { self.gossip() }, 1000);
}

gossip.prototype.stop = function() {
  this.server.close();
  clearInterval(this.heartBeatTimer);
  clearInterval(this.gossipTimer);
}


// The method of choosing which peer(s) to gossip to is borrowed from Cassandra.
// They seemed to have worked out all of the edge cases
// http://wiki.apache.org/cassandra/ArchitectureGossip
gossip.prototype.gossip = function() {
  // Find a live peer to gossip to
  if(this.livePeers().length > 0) {
    var live_peer = this.chooseRandom(this.livePeers());
    this.gossipToPeer(live_peer);
  }

  // Possilby gossip to a dead peer
  var prob = this.deadPeers().length / (this.livePeers().length + 1)
  if(Math.random() < prob) {
    var dead_peer = this.chooseRandom(this.deadPeers());
    this.gossipToPeer(dead_peer);
  }

  // Gossip to seed under certain conditions
  if(live_peer && !this.seeds[live_peer] && this.livePeers().length < this.seeds.length) {
    if(Math.random() < (this.seeds / this.allPeers.size())) {
      this.gossipToPeer(chooseRandom(this.peers));
    }
  }

  // Check health of peers
  for(var i in this.peers) {
    var peer = this.peers[i];
    if(peer != this.my_state) {
      peer.isSuspect();
    }
  }
}

gossip.prototype.chooseRandom = function(peers) {
  // Choose random peer to gossip to
  var i = Math.floor(Math.random()*1000000) % peers.length;
  return peers[i];
}

gossip.prototype.gossipToPeer = function(peer) {
  var a = peer.split(":");
  var gosipee = new net.createConnection(a[1], a[0]);
  var self = this;
  gosipee.on('connect', function(net_stream) {
    var mp_stream = new msgpack.Stream(gosipee);
    mp_stream.on('msg', function(msg) { self.handleMessage(gosipee, mp_stream, msg) });
    mp_stream.send(self.requestMessage());
  });
  gosipee.on('error', function(exception) {
//    console.log(self.peer_name + " received " + util.inspect(exception));
  });
}

gossip.REQUEST          = 0;
gossip.FIRST_RESPONSE   = 1;
gossip.SECOND_RESPONSE  = 2;

gossip.prototype.handleMessage = function(net_stream, mp_stream, msg) {
  switch(msg.type) {
    case gossip.REQUEST:
      mp_stream.send(this.firstResponseMessage(msg.digest));
      break;
    case gossip.FIRST_RESPONSE:
      this.scuttle.updateKnownState(msg.updates);
      mp_stream.send(this.secondResponseMessage(msg.request_digest));
      net_stream.end();
      break;
    case gossip.SECOND_RESPONSE:
      this.scuttle.updateKnownState(msg.updates);
      net_stream.end();
      break;
    default:
      // shit went bad
      break;
  }
}

// MESSSAGES


gossip.prototype.handleNewPeers = function(new_peers) {
  var self = this;
  for(var i in new_peers) {
    var peer_name = new_peers[i];
    this.peers[peer_name] = new PeerState(peer_name);
    this.emit('new_peer', peer_name);

    var peer = this.peers[peer_name];
    this.listenToPeer(peer);
  }
}

gossip.prototype.listenToPeer = function(peer) {
  var self = this;
  peer.on('update', function(k,v) {
    self.emit('update', peer.name, k, v);
  });
  peer.on('peer_alive', function() {
    self.emit('peer_alive', peer.name);
  });
  peer.on('peer_failed', function() {
    self.emit('peer_failed', peer.name);
  });
}

gossip.prototype.requestMessage = function() {
  var m = {
    'type'    : gossip.REQUEST,
    'digest'  : this.scuttle.digest(),
  };
  return m;
};

gossip.prototype.firstResponseMessage = function(peer_digest) {
  var sc = this.scuttle.scuttle(peer_digest)
  this.handleNewPeers(sc.new_peers);
  var m = {
    'type'            : gossip.FIRST_RESPONSE,
    'request_digest'  : sc.requests,
    'updates'         : sc.deltas
  };
  return m;
};

gossip.prototype.secondResponseMessage = function(requests) {
  var m = {
    'type'    : gossip.SECOND_RESPONSE,
    'updates' : this.scuttle.fetchDeltas(requests)
  };
  return m;
};

gossip.prototype.setLocalState = function(k, v) {
  this.my_state.updateLocal(k,v);
}

gossip.prototype.getLocalState = function(k) {
  return this.my_state.getValue(k);
}

gossip.prototype.peerKeys = function(peer) {
  return this.peers[peer].getKeys();
}

gossip.prototype.peerValue = function(peer, k) {
  return this.peers[peer].getValue(k);
}

gossip.prototype.allPeers = function() {
  var keys = [];
  for(var k in this.peers) { keys.push(k) };
  return keys;
}

gossip.prototype.livePeers = function() {
  var keys = [];
  for(var k in this.peers) { if(this.peers[k].alive) { keys.push(k)} };
  return keys;
}

gossip.prototype.deadPeers = function() {
  var keys = [];
  for(var k in this.peers) { if(!this.peers[k].alive) { keys.push(k) } };
  return keys;
}
