var type = require('component-type'),
    utils = require('./utils'),
    sha1 = require('sha1'),
    afd = require('afd')


/**
 * sets the peer as alive and returns that the peer is not suspect (false)
 *
 * it also emits the alive event
 *
 * @param {state}
 * @returns {boolean}
 */
var alive = function (state) {
  if(state.alive) return false
  state.emit('alive', state)
  state.alive = true
  return false
}

/**
 * sets the peer as dead and returns that the peer is suspect (true)
 *
 * it also emits the failed event
 *
 * @param {state}
 * @returns {boolean}
 */
var dead = function (state) {
  if(!state.alive) return true
  state.emit('failed', state)
  state.alive = false
  return true
}


/**
 * Representation and management of peer state
 *
 * ```
 * var state = require('state')
 * // local = true; seed = false; hostname = '127.0.0.1', port = 4567
 * state(true, false, '127.0.0.1', 4567)
 * ```
 *
 * @param {bolean} local If the peer is local
 * @param {boolean} seed the peer is a seed
 * @param {string} hostname the peer http host
 * @param {number} ip the peer tcp port
 * @returns {state}
 */
var state = module.exports = function (local, seed, hostname, port) {
  if(!(this instanceof state)) return new state(local, seed, hostname, port)

  this.local = !!local
  this.seed = !!seed
  this.hostname = hostname
  this.port = port

  this.detector = afd()
  this.alive = true
}

require('util').inherits(state, require('events').EventEmitter)

/**
 * Get the `identification` object of this peer (name, port, ip)
 *
 * @returns {object}
 */
state.prototype.identification = function () {
  return utils.identification(this)
}

/**
 * Get the `name` of the peer
 *
 * @returns {string}
 */
state.prototype.name = function () {
  return [this.hostname, this.port].join(':')
}

/**
 * Get the `id` of the peer (sha1 of the `name`)
 *
 * @returns {string}
 */
state.prototype.id = function () {
  return sha1(this.name)
}

/**
 * update the aliveliness of the peer
 */
state.prototype.beat = function () {
  this.detector.report()
}

/**
 * Test if the peer is suspect
 *
 * @returns {boolean}
 */
state.prototype.suspect = function () {
  if(this.local) return false
  if(this.detector.phi() > 2) return dead(this)
  return alive(this)
}