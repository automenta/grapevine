/**
 * Scuttlebutt
 * @module gossip/scuttle
 */


/**
 * @constructor
 * @param {Object} peers key/value object with the known peers name and its state
 * @param {State} local Local state
 */
var scuttle = function (peers, local) {
  this.peers = peers
  this.local = local
}

/**
 * Get the digest from the known peers state
 * It's an array containing the name and the max_version_seen seen of each known peer
 * @returns {Array}
 */
scuttle.prototype.digest = function () {
  return Object.keys(this.peers).map(function (name) {
    return {
      version: this.peers[peer].version,
      name: name
    }
  }.bind(this))
}

/**
 * Parse the digest from other peer and returns the new peers,
 * the requested deltas and the identified deltas
 *
 * @param {Object} digest Array with the version and name of each peer
 * @returns {Object}
 */
scuttle.prototype.scuttle = function (digest) {
  // array of unknown peer names
  var new_peers = []
  // array of requests that need to be done asking for info about unknown peers
  var requests = []
  // updated attrs from peers were we have data more recent than the digest
  var deltas = []
  
  digest.forEach(function (peer) {
    // We don't know about this peer. Request all information.
    if(!this.peers[peer.name]) return new_peers.push(peer)
    
    // They have more recent information, request it.
    if(this.version(peer.name) < peer.version) return requests.push({
      version: this.peers[peer.name].version,
      peer: peer.name
    })
    
    // Everything is the same.
    if(this.version(peer.name) == peer.version) return
    
    // We have more recent information for this peer. Build up deltas.
    this.peers[peer.name].deltas(peer.version).sort(function (a, b) {
      // Sort deltas by version number
      return a.version - b.version
    }).forEach(function (delta) {
      delta.peer = peer.name
      deltas.push(delta)
    })
  }.bind(this))
    
  return {
    new_peers: new_peers,
    requests: requests,
    deltas: deltas
  }
}

/**
 * Get the max version number seen
 * @param {State} peer
 * @returns {Number}
 */
scuttle.prototype.version = function (peer) {
  if(!this.peers[peer]) return 0
  return this.peers[peer].version
}

/**
 * Update the state of this peers with the value and version of the deltas
 * @param {Array} deltas
 */
scuttle.prototype.update = function (deltas) {
  deltas.forEach(function (delta) {
    this.peers[delta.peer].value(delta.key, delta.value, delta.version)
  }.bind(this))
}

/**
 * Generate the deltas based on a request of other peer
 * @param {Array} deltas
 */
scuttle.prototype.deltas = function (requests) {
  return requests.map(function (req) {
    var deltas = this.peers[req.peer].deltas(req.version)
    return deltas.sort(function (a, b) {
      return a.version - a.version
    })
  }.bind(this))
}


/**
 * Exports the scuttle constructor
 */
module.exports = function (name, local) {
  return new scuttle(name, local)
}
