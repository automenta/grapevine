var propagate = require('propagate'),
    interpolate = require('util').format,
    type = require('component-type'),
    utils = require('./utils'),
    state = require('./state')


/**
 * Peers/Seeds hander
 *
 * @param {state} state
 */
var peers = module.exports = function (state) {
  if(!(this instanceof peers)) return new peers(state)
  
  this.state = state
  this.seeds = {}
  this.peers = {}
}

require('util').inherits(peers, require('events').EventEmitter)

/**
 * Get all known identifications, including it's own
 *
 * @returns {array} identifications
 */
peers.prototype.idenfifications = function () {
  return utils.values(this.peers).map(function (peer) {
    return peer.identification()
  }).concat(this.state.identification())
}

/**
 * From an array of `identifications`, add the ones that are unknown
 *
 * @param {array} identifications
 */
peers.prototype.identify = function (identifications) {
  this.push(identifications.map(function (identification) {
    // FIX THIS (WHY THE PORT IS A STRING?)
    identification.port = Number(identification.port)
    if(!this.peers[identification.name]) return identification
  }.bind(this)).filter(function (identification) {
    return !!identification
  }))
}

/**
 * return all peers that we know about, but the other peer doesn't
 *
 * @param {array} identifications
 * @returns {array} identifications
 */
peers.prototype.deltas = function (identifications) {
  return utils.values(this.peers).filter(function (peer) {
    return identifications.filter(function (identification) {
      return identification.name === peer.name()
    }).length === 0
  })
}

/**
 * Get the names from all peers
 *
 * @param {array} names
 */
peers.prototype.names = function () {
  return utils.values(this.peers).map(function (peer) {
    return peer.name()
  })
}

/**
 * Get the name with especified name
 *
 * @param {string} name
 */
peers.prototype.find = function (name) {
  return utils.values(this.peers).filter(function (peer) {
    return peer.name() === name
  }).shift()
}

/**
 * Get the ids from all peers
 *
 * @param {array} ids
 */
peers.prototype.ids = function () {
  return utils.values(this.peers).map(function (peer) {
    return peer.id()
  })
}

/**
 * choose a random peer
 *
 *  * if an array is provided, then it chooses a random from that array
 *  * if the no parameter is provided, it chooces a random from it's known peers
 *  * if a boolean=true is provided, it chooces a random from it's known seeds
 *
 * @param {array|boolean} [peers|seeds]
 * @returns {state}
 */
peers.prototype.random = function (peers) {
  if(type(peers) === 'undefined') peers = this.peers
  if(peers === true) peers = this.seeds

  return peers[Math.floor(Math.random()*(peers.length + 1))]
}

/**
 * Handle new peers
 * 
 * it adds them to it's list of known peers, and subscribes to it's events
 * it handles a single peer and an array of peers
 *
 * @param {array|state} [peers|seeds]
 */
peers.prototype.push = function (peer) {
  if(Array.isArray(peer)) return Array.prototype.forEach.call(peer, this.push.bind(this))
  
  // Peer is itself. This happens because other peer sent all his peers info,
  // which this peer is part of
  if(peer.port === this.state.port) return
  
  // Peer already exists
  if(this.find(peer.name)) return
  
  // create a new state for this peer
  this.peers[peer.name] = state(false, !!peer.seed, peer.hostname, peer.port)
  
  // if the peer is a seed, add it to the seeds object
  if(!!peer.seed) this.seeds[peer.name] = this.peers[peer.name]
  
  // propagate events from the peer
  propagate(this.peers[peer.name], this)
  
  // since we just added this peer, then emit the `new` peer event
  this.emit('new', this.peers[peer.name])
}

/**
 * Get all peers that are identified as alive
 *
 * @returns {array} alive_peers
 */
peers.prototype.alive = function () {
  return utils.values(this.peers).filter(function (peer) {
    return peer.alive
  })
}

/**
 * Get all peers that are identified as dead
 *
 * @returns {array} dead_peers
 */
peers.prototype.dead = function () {
  return utils.values(this.peers).filter(function (peer) {
    return !peer.alive
  })
}

/**
 * Go throught all peers and check suspicion of each
 */
peers.prototype.suspect = function () {
  utils.values(this.peers).forEach(function (peer) {
    peer.suspect()
  })
}