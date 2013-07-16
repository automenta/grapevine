var server = require('./server'),
    utils = require('./utils'),
    state = require('gstate')


/**
 * @param {Array} seeds
 */
var peers = module.exports = function () {
  if(!(this instanceof peers)) return new peers()
  
  this.peers = {}
  this.seeds = {}
}

require('util').inherits(peers, require('eventemitter2').EventEmitter2)

/**
 * Get the names from all peers
 *
 * @param {Array} seeds
 */
peers.prototype.names = function () {
  return utils.values(this.peers).map(function (peer) {
    return peer.name
  })
}

/**
 * choose a random peer
 *
 * @param {Array|Boolean} [peers]
 * @returns {String} host
 */
peers.prototype.random = function (peers) {
  if(type(peers) === 'undefined') peers = this.peers
  if(peers === true) peers = this.seeds

  return peers[Math.floor(Math.random()*(peers.length + 1))]
}

/**
 * Handle new Peers
 */
peers.prototype.push = function (name, local, seed) {
  this.peers[name] = state(name, local, seed)
  //TODO: listen to state events
  this.emit('new', this.peers[name])
}

/**
 * Get the keys in a peer state
 *
 * @param {String} name
 * @returns {Array}
 */
peers.prototype.keys = function (name) {
  return this.peers[name].keys()
}

/**
 * Get the value of a peer
 *
 * @param {String} peer
 * @param {String} key
 * @returns {Any}
 */
peers.prototype.value = function (name, key) {
  return this.peers[peer].value(key)
}

/**
 * Get all peers that are identified as alive
 *
 * @returns {Array}
 */
peers.prototype.alive = function () {
  return utils.values(this.peers).filter(function (peer) {
    return peer.alive
  })
}

/**
 * Get all peers that are identified as dead
 *
 * @returns {Array}
 */
peers.prototype.dead = function () {
  return utils.values(this.peers).filter(function (peer) {
    return !peer.alive
  })
}

/**
 * Go throught all peers and check suspicion of each
 *
 * @returns {Array}
 */
peers.prototype.suspect = function () {
  utils.values(this.peers).forEach(function (peer) {
    peer.suspect()
  })
}