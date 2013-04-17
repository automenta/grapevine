/**
 * Representation and management of peer states. Both local and remote
 * @module gossip/state
 */
var compact = require('lodash').compact,
    afd = require('./afd'),
    util = require('util')


/**
 * @constructor
 * @param {String} name The name of the peer (ex 192.168.2.122:2345)
 * @param {Boolean} [local=false] If the peer is local
 */
var State = function (name, local) {
  this.local = local || false
  this.detector = afd()
  this.alive = true
  this.version = 0
  this.name = name
  this.attrs = {}
  this.PHI = 8
}

/**
 * Set/Get the peer attribute value
 * @param {String} key The name of the attribute to set/get
 * @param {Boolean|Number|String|Array|Object} [value] The value to define
 * @param {Number} [version] The version of the peer state
 * @returns {Undefined|Boolean|Number|String|Array|Object}
 */
State.prototype.value = function (key, value, version) {
  if(value === undefined) return this.__getValue(key)
  this.__setValue(key, value, version)
}

/**
 * Set the peer attribute value
 * @access private
 * @param {String} key The name of the attribute to set/get
 * @param {Undefined} value The value to define
 * @param {Number} version The version of the peer state
 * @returns {Undefined}
 */
State.prototype.__setValue = function (key, value, version) {
  // It's possibly to get the same updates more than once if we're gossiping with multiple peers at once ignore them
  if(version <= this.version) return
  
  if(this.local) this.version += 1
  else this.version = version
  
  this.attrs[key] = {value: value, version: version}
  this.emit('update', key, version)
  
  if(key == '__heartbeat__' && !this.local) this.detector.add(new Date().getTime())
}

/**
 * Get the peer attribute value
 * @access private
 * @param {String} key The name of the attribute to set/get
 * @returns {Boolean|Number|String|Array|Object}
 */
State.prototype.__getValue = function (key) {
  if(this.attrs[key] === undefined) return
  return this.attrs[k].value
}

/**
 * Get the attributes keys
 * @returns {Array}
 */
State.prototype.keys = function () {
  return Object.keys(this.attrs)
}

/**
 * Fire the heart beat
 */
State.prototype.beat = function () {
  this.value('__heartbeat__', this.heart_beat_version += 1)
}

/**
 * Get the deltas after a version
 * it returns an array with the attrs that have a lower version
 * @returns {Array}
 */
State.prototype.deltas = function (version) {
  return compact(Object.keys(this.attrs).map(function (key) {
    // the attr version is lower then the requested minimum version
    if(this.attrs[key].version <= version) return
    var attr = this.attrs[key]
    
    return {
      value: attr.value,
      version: attr.version,
      key: key
    }
  }.bind(this)))
}

/**
 * Identify if the peer is suspect
 * @returns {Boolean}
 */
State.prototype.suspect = function () {
  var phi = this.detector.phi()

  if(phi > this.PHI) return this.dead()
  return this.alive()
}

/**
 * Set the peer as alive
 * @returns {Boolean}
 */
State.prototype.alive = function () {
  if(this.alive) return false
  this.alive = true
  this.emit('peer_alive')
  return false
}

/**
 * Set the peer as dead
 * @returns {Boolean}
 */
State.prototype.dead = function () {
  if(!this.alive) return true
  this.alive = false
  this.emit('peer_failed')
  return true
}

util.inherits(State, require('events').EventEmitter)


/**
 * Exports the State constructor
 */
module.exports = function (name, local) {
  return new State(name, local)
}