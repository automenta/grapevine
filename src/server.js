var darius = require('darius'),
    dns = require('dns'),
    os = require('os')

var server = module.exports = function (port, scuttle, callback) {
  if(!(this instanceof server)) return new server(port, scuttle, callback)

  // find the host to bind
  dns.lookup(os.hostname(), 4, function (e, host) {
    if(e) return callback(e)
    // Create Server
    this.server = darius.createServer()
    this.server.listen(port, host, function (e) {
      if(e) return callback(e)
      // Listen to inc requests
      this.server.post('/digest', this.digest.bind(this))
      this.server.post('/scuttle', this.scuttle.bind(this))
      this.server.post('/deltas', this.deltas.bind(this))
      
      // pipe server error
      //utils.fall(['error'], self.server, self)
      // start timers
      //this.timers.start()
      // pipe peer events
      // utils.bubble(this.server, this)
      // utils.bubble(this.peers, this)
      callback()
    }.bind(this))
  }.bind(this))
}

require('util').inherits(server, require('eventemitter2').EventEmitter2)

server.prototype.gossip = function (peer, digest) {
  darius.post(interpolate('%s/digest', peer.name), {
    host: this.host,
    port: this.port,
    digest: digest
  }, function (e) {
    if(e) this.emit(e)
  }.bind(this))
}

server.prototype.digest = function (req) {
  var scuttle = this.scuttle.scuttle(req.body.digest)
  var url = interpolate('%s:%s/scuttle', req.body.host, req.body.port)
  
  this.handleNewPeers(scuttle.new_peers)
  
  darius.post(url, {
    host: this.host,
    port: this.port,
    requests: scuttle.requests,
    deltas: scuttle.deltas
  }, function (e) {
    if(e) this.emit(e)
  }.bind(this))
}

server.prototype.scuttle = function (req) {
  var url = interpolate('%s:%s/deltas', req.body.host, req.body.port)
  this.scuttle.updateKnownState(msg.deltas);
  
  darius.post(url, {
    host: this.host,
    port: this.port,
    deltas: scuttle.deltas(req.requests)
  }, function (e) {
    if(e) this.emit(e)
  }.bind(this))
}

server.prototype.deltas = function (req) {
  this.scuttle.updateKnownState(msg.deltas);
}