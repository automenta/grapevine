var scuttle = require('gscuttle'),
    server = require('./server'),
    utils = require('./utils'),
    peers = require('./peers'),
    state = require('gstate')


/**
 * Gossip protocol based on  the paper [Efﬁcient Reconciliation and Flow Control for Anti-Entropy Protocols](http://www.cs.cornell.edu/home/rvr/papers/flowgossip.pdf)
 *
 * @param {string} [id=new puid()] the id of the peer
 * @param {number} [port=0] tcp port to comunicate with other peers
 * @param {array} [seeds=[]]
 * @param {function} [callback]
 */
var gossip = module.exports = function (opts) {
  if(!(this instanceof gossip)) return new gossip(utils.args.apply(null, arguments))

  this.state = state(true)
  this.seeds = opts.seeds
  this.peers = peers()

  this.scuttle = scuttle(peers.peers, this.state)
  this.server = server(opts.port, this.scuttle, opts.callback)
  this.timers = utils.timers(this.gossip, this.state.beat)
  
  this.value('id', opts.id)
}

require('util').inherits(gossip, require('eventemitter2').EventEmitter2)

/**
 * Stop the net.Server and don't gossip anymore
 * @returns {gossip}
 */
gossip.prototype.stop = function () {
  // TODO unlisten all events
  //this.server.close()
  //this.timers.stop()
}

/**
 * Get/set a value of state attrs
 * @param {String} key
 * @param {Any} value
 * @returns {Any}
 */
gossip.prototype.value = function (key, value) {
  return this.state.value(key, value)
}

/**
 * Get the peer with the address
 * @param {String} address
 * @returns {Peer}
 */
gossip.prototype.peer = function (address) {
  return this.peers.peer(address)
}

gossip.prototype.gossip = function (gossip) {
  /**
  * timers.gossip intervall handler
  *
  * The method of choosing which peer(s) to gossip to is borrowed from Cassandra.
  * They seemed to have worked out all of the edge cases: http://wiki.apache.org/cassandra/ArchitectureGossip
  * @access private
  */


  // Check health of all peers
  this.peers.suspect()

  var peers = utils.values(this.peers.peers)
  var seeds = this.peers.seeds

  var live_peers = this.peers.alive()
  var dead_peers = this.peers.dead()

  var live_peer = this.peers.random(live_peers)
  var dead_peer = this.peers.random(dead_peers)
  // Find a live peer to gossip to
  if(live_peer) this.server.send.digest(live_peer)

  // Possilby gossip to a dead peer
  var probability = dead_peers.length / (live_peers.length + 1)
  if(dead_peer && (Math.random() < probability)) this.server.send.digest(dead_peer)

  // Gossip to seed under certain conditions:
  // * there is at least a live peer
  // * the choosen live peer is not a seed
  // * the number of live peers is smaller than the number of seeds
  if(!(live_peer && !seeds[live_peer] && live_peers.length < seeds.length)) return
  if(!(Math.random() < (Object.keys(this.seeds).length / Object.keys(peers).length))) return
  this.server.send.digest(this.peers.random(seeds))
}

gossip.prototype.listening = function (port, host, callback) {
  gossip.host = address.address
  gossip.port = address.port
  
  gossip.state.name = util.format('%s:%s', gossip.host, address.port)
  
  //self.peers.handle_seeds()
  //self.timers.start()
  
  callback(null, gossip)
}