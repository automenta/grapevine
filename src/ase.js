require('longjohn')

var propagate = require('propagate'),
    server = require('./server'),
    utils = require('./utils'),
    peers = require('./peers'),
    state = require('./state'),
    util = require('util')


/**
 * Gossip-like protocol based on  the paper [Efﬁcient Reconciliation and Flow Control for Anti-Entropy Protocols](http://www.cs.cornell.edu/home/rvr/papers/flowgossip.pdf)
 *
 * @param {array} [seeds] array of the names (`hostname`:`port`) of seeds
 * @param {http.Server} [server]
 * @param {function} [callback]
 */
var ase = module.exports = function (opts) {
  if(!(this instanceof ase)) return new ase(utils.args.apply(null, arguments))
  
  this.state = state(true, false)
  this.peers = peers(this.state)
  this.opts = opts  
  // listen to events from peers and propagate them
  propagate(this.peers, this)
  // start the server
  this.start()
}

util.inherits(ase, require('events').EventEmitter)

/**
 * Stop the `http.Server` and don't gossip anymore
 */
ase.prototype.stop = function () {
  if(!this.opts.srv_provided) this.server.close()
  clearInterval(this.timer)
}

/**
 * Start the `http.Server`, timers, and event listeners.
 * Also handles the constructor `callback` and defines the `hostname`, `port`, 
 * `name` and `id`
 */
ase.prototype.start = function () {
  // create a new server manager instance
  this.server = server(this.opts.server, this.peers, function (e) {
    if(e) return this.opts.callback(e)
    
    this.hostname = this.state.hostname = this.server.hostname
    this.port = this.state.port = this.server.port
    
    this.name = this.state.name()
    this.id = this.state.id()
    
    // start the gossip timer
    this.timer = setInterval(this.gossip.bind(this), 1000)
    // callback
    this.opts.callback(null, this)
    // handle seeds
    this.peers.push(this.opts.seeds.map(utils.seedit))
  }.bind(this))
  
  // if the http server is not provided, it's our responsability to start it
  if(!this.opts.srv_provided) this.opts.server.listen(this.state.port)
  // listen to events from server and propagate them
  propagate(this.server, this)
  // stop gossip once the http server is closed
  this.server.on('close', this.stop.bind(this))
}

/**
 * gossip intervall handler
 *
 * The method of choosing which peer(s) to gossip to is borrowed from Cassandra.
 *
 * They seemed to have worked out all of the edge cases: [http://wiki.apache.org/cassandra/ArchitectureGossip](http://wiki.apache.org/cassandra/ArchitectureGossip)
 * @access private
 */
ase.prototype.gossip = function (gossip) {
  // Check health of all peers
  this.peers.suspect()
  
  // peer identifications
  var identifications = this.peers.idenfifications()
  // all known eers
  var peers = utils.values(this.peers.peers)
  // all known seeds
  var seeds = utils.values(this.peers.seeds)

  // all alive peers
  var alive_peers = this.peers.alive()
  // all dead peers
  var dead_peers = this.peers.dead()
  
  // random alive peer
  var alive_peer = this.peers.random(alive_peers)
  // random dead peer
  var dead_peer = this.peers.random(dead_peers)
  // random seed
  var seed = this.peers.random(seeds)

  // function to filter the identifications,
  // in order to preven us to send the identification of the peer
  // who we are sending all the identifications
  var filter = function (to) {
    return function (peer) {
      return to.name() !== peer.name
    }
  }
  
  // Find a live peer to gossip to
  if(alive_peer)
    this.server.propagate(alive_peer, identifications.filter(filter(alive_peer)))

  // Possilby gossip to a dead peer
  var probability = dead_peers.length / (alive_peers.length + 1)
  if(dead_peer && (Math.random() < probability))
    this.server.propagate(dead_peer, identifications.filter(filter(dead_peer)))

  // Gossip to seed under certain conditions:
  // * there is at least a live peer
  // * the choosen live peer is not a seed
  // * the number of live peers is smaller than the number of seeds
  if(!(alive_peer && !seeds[alive_peer] && alive_peers.length < seeds.length)) return
  if(!(Math.random() < (seeds.length / peers.length))) return
  
  // propagate to random seed
  this.server.propagate(seed, identifications.filter(filter(seed)))
}