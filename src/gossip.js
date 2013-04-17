/**
 * Gossipe Protocol
 * @module gossip
 */

var compact = require('lodash').compact,
    scuttle = require('./scuttle'),
    msgpack = require('msgpack2'),
    state = require('./state'),
    util = require('util'),
    net = require('net'),
    dns = require('dns'),
    os = require('os')

var noop = function () {}
var SECOND_RESPONSE = 'SECOND_RESPONSE'
var FIRST_RESPONSE = 'FIRST_RESPONSE'
var REQUEST = 'REQUEST'



/**
 * @constructor
 * @param {Array} seeds
 * @param {String} host
 */
var gossip = function (seeds, host) {
  this.state = state(null, true)
  this.hostname = hostname
  this.seeds = seeds
  this.timers = {}
  this.peers = {}
  
  this.scuttle = scuttle(this.peers, this.state)
}

/**
 * Start the server
 * @param {Function} callback
 * @returns {gossip}
 */
gossip.prototype.start = function (callback) {
  // Create Server
  this.server = net.createServer(this.listener.bind(this))
  // if the host opt is defined, bind to that host
  if(this.hostname) return this.server.listen(0, this.hostname, this.listening.bind(this, callback))
  // if there is no host defined, find the network ip and bind to that
  dns.lookup(os.hotname(), 4, function (e, hostname) {
    if(e) return callback(e)
    this.server.listen(0, hostname, this.listening.bind(this, callback))
  }.bind(this))

  return this
}

/**
 * Callback for the net.CreateServer().listen
 * @access private
 * @param {Function} callback
 * @returns {gossip}
 */
gossip.prototype.listening = function (callback) {
  this.address = this.server.address().address
  this.port = this.server.address().port
  this.name = [this.address, this.port.toString()].join(':')
  this.state.name = this.name
  
  this.handleNewPeers(this.seeds)
  this.timers.beat = setInterval(this.state.beat.bind(this.state), 1000)
  this.timers.gossip = setInterval(this.gossip.bind(this), 1000)
  
  callback(null, this)
  return this
}

/**
 * net.Server connection listener
 * @access private
 * @param {Function} callback
 */
gossip.prototype.listener = function (connection) {
  var msgpackstream = new msgpack.Stream(stream)
  
  msgpackstream.on('msg', function (msg) {
    this.handleMessage(stream, msgpackstream, msg)
  }.bind(this))
}

/**
 * Stop the net.Server and don't gossip anymore
 * @returns {gossip}
 */
gossip.prototype.stop = function () {
  this.server.close()
  Object.keys(this.timers).forEach(function (timer) {
    clearInterval(this.timers[timer])
  }.bind(this))
  return this
}

/**
 * timers.gossip intervall handler
 *
 * The method of choosing which peer(s) to gossip to is borrowed from Cassandra.
 * They seemed to have worked out all of the edge cases: http://wiki.apache.org/cassandra/ArchitectureGossip
 * @access private
 */
gossip.prototype.gossip = function () {
  var allPeers = Object.keys(this.peers)
  var livePeers = this.livePeers()
  var deadPeers = this.deadPeers()
  var livePeer = this.random(livePeers)
  var deadPeer = this.random(deadPeers)
  var constrained = true
  
  // Find a live peer to gossip to
  if(livePeer) this.gossipToPeer(livePeer)
  
  // Possilby gossip to a dead peer
  var probability = deadPeers.length / (livePeers.length + 1)
  if(deadPeer && (Math.random() < probability)) this.gossipToPeer(deadPeer)
  
  // Gossip to seed under certain conditions:
  // * there is at least a live peer
  // * the choosen live peer is not a seed
  // * the number of livePeers is smaller than the number of seeds
  constrained = !(livePeer && !this.seeds[livePeer] && livePeers.length < this.seeds.length)
  constrained = !(constrained && Math.random() < (this.seeds.length / allPeers.length))
  if(!constrained) this.gossipToPeer(this.random(this.seeds))

  // Check health of all peers
  allPeers.forEach(function (name) {
    var peer = this.peers[name]
    if(peer.name !== this.state.name) peer.suspect()
  }.bind(this))
}

/**
 * choose a random peer
 * @param {Array} peers
 * @returns {String}
 */
gossip.prototype.random = function (peers) {
  return peers[Math.floor(Math.random()*1000000) % peers.length];
}

/**
 * gossip to peer
 * @access private
 * @param {String} peer
 */
gossip.prototype.gossipToPeer = function (peer) {
  var adress = peer.split(':')
  var connection = new net.createConnection(a[1], a[0])
  
  connection.on('connect', function (stream) {
    var msgpackstream = new msgpack.Stream(stream)
    
    msgpackstream.on('msg', function (msg) {
      gossip.prototype[msg.type](connection, msgpackstream, msg)
    }.bind(this))
    
    msgpackstream.send(this.requestMessage())
  }.bind(this))
  
  connection.on('error', function (e) {
    //don't throw
    throw e
  })
}

/**
 * RESQUEST
 * @access private
 * @param {Object} connection
 * @param {Stream} msgpackstream
 * @param {Number|Object|Array|Boolean} msg
 */
gossip.prototype[REQUEST] = function (connection, msgpackstream, msg) {
  connection.send(this[FIRST_RESPONSE + 'message'](msg.digest))
}

/**
 * FIRST_RESPONSE
 * @access private
 * @param {Object} connection
 * @param {Stream} msgpackstream
 * @param {Number|Object|Array|Boolean} msg
 */
gossip.prototype[FIRST_RESPONSE] = function (connection, msgpackstream, msg) {
  this.scuttle.update(msg.updates)
  connection.send(this[SECOND_RESPONSE + 'message'](msg.request_digest))
  connection.end()
}

/**
 * SECOND_RESPONSE
 * @access private
 * @param {Object} connection
 * @param {Stream} msgpackstream
 * @param {Number|Object|Array|Boolean} msg
 */
gossip.prototype[SECOND_RESPONSE] = function (connection, msgpackstream, msg) {
  this.scuttle.update(msg.updates)
  connection.end()
}

/**
 * REQUESTmessage
 * @access private
 * @returns {Object}
 */
gossip.prototype[REQUEST + 'message'] = function () {
  return {
    digest: this.scuttle.digest(),
    type: REQUEST
  }
}

/**
 * FIRST_RESPONSEmessage
 * @access private
 * @param {Object} digest
 * @returns {Object}
 */
gossip.prototype[FIRST_RESPONSE + 'message'] = function (digest) {
  var scuttle = this.scuttle.scuttle(digest)
  this.handleNewPeers(scuttle.new_peers)
  scuttle.type = FIRST_RESPONSE
  return scuttle
}

/**
 * SECOND_RESPONSEmessage
 * @access private
 * @param {Array} requests
 * @returns {Object}
 */
gossip.prototype[SECOND_RESPONSE + 'message'] = function (requests) {
  return {
    type: SECOND_RESPONSE,
    updates: this.scuttle.deltas(requests)
  }
}

/**
 * Handle new Peers
 * @access private
 * @param {Array} peers
 */
gossip.prototype.handleNewPeers = function (peers) {
  peers.forEach(function (peer) {
    this.peers[peer] = state(peer)
    this.listenToPeer(this.peers[peer])
    this.emit('new_peer', peer)
  }.bind(this))
}

/**
 * Add event listeners for a peer
 * @access private
 * @param {state} peer
 */
gossip.prototype.listenToPeer = function (peer) {
  var emit = function (ev, self) {
    return function () {
      arguments = Array.prototype.unshift.call(arguments, ev, peer.name)
      self.emit.apply(self, arguments)
    }
  }
  
  peer.on('peer_failed', emit('peer_failed', this))
  peer.on('peer_alive', emit('peer_alive', this))
  peer.on('update', emit('update', this))
}

/**
 * Get/set a value of state attrs
 * @param {String} key
 * @param {Number|Object|Array|Boolean|Null|Undefined} value
 * @returns {Number|Object|Array|Boolean|Null|Undefined}
 */
gossip.prototype.value = function (key, value) {
  return this.state.value(key, value)
}

/**
 * Get the keys in a peer state
 * @param {String} peer
 * @returns {Array}
 */
gossip.prototype.peerKeys = function (peer) {
  return this.peers[peer].keys()
}

/**
 * Get the value of a remote peer
 * @param {String} peer
 * @param {String} key
 * @returns {Number|Object|Array|Boolean|Null|Undefined}
 */
gossip.prototype.peerValue = function (peer, key) {
  return this.peers[peer].value(key)
}

/**
 * all peers that are identified as live
 * @returns {Array}
 */
gossip.prototype.livePeers = function () {
  return compact(Object.keys(this.peers).map(function (name) {
    if(this.peers[name].alive) return name
  }))
}

/**
 * all peers that are identified as dead
 * @returns {Array}
 */
gossip.prototype.deadPeers = function () {
  return compact(Object.keys(this.peers).map(function (name) {
    if(!this.peers[name].alive) return name
  }))
}

util.inherits(gossip, require('events').EventEmitter)


/**
 * @returns {gossip}
 */
module.exports = function () {
  var seeds = new Array()
  var hostname = false
  var callback = noop

  Array.prototype.forEach.apply(arguments, function (argument) {
    if(typeof argument === 'function') callback = argument
    if(typeof argument === 'string') hostname = argument
    if(Array.isArray(argument)) seeds = argument
  })

  return new gossip(seeds, hostname).start(callback)
}