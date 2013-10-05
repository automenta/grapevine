var propagate = require('propagate'),
    interpolate = require('util').format,
    request = require('request'),
    jsonmw = require('json-body'),
    utils = require('./utils'),
    dns = require('dns'),
    os = require('os')


/**
 * http.Server handler
 *
 * @param {http.Server} node
 * @param {object} peers
 * @param {fn} callback
 */
var server = module.exports = function (srv, peers, callback) {
  if(!(this instanceof server)) return new server(srv, peers, callback)
  
  this.peers = peers
  this.server = srv

  // propagate close event
  propagate(['close', 'error'], srv, this)
    
  // add request handler
  srv.on('request', function (req, res) {
    if(req.method.toUpperCase() !== 'POST') return
    if(req.url.toLowerCase() !== '/identifications') return
    this.identifications(req, res)
  }.bind(this))
  
  // find the hostname
  dns.lookup(os.hostname(), 4, function (e, hostname) {
    if(e) return callback(e)
    // Create Server
    this.port = srv.address().port
    this.hostname = hostname
    callback(e)
  }.bind(this))
}

require('util').inherits(server, require('events').EventEmitter)

/**
 * Propagate the peers we know
 *
 * @param {peer} to the peer we want to propagate to
 * @param {array} identifications the peers we know aout
 * @param {boolean} ig ignore error
 */
server.prototype.propagate = function (to, identifications) {
  var url = interpolate('http://%s:%s/identifications', to.hostname, to.port)
  // POST http://hostname:port/identifications
  request.post(url, {json: {
    // send all known peers
    identifications: identifications,
    // send its own name
    from: this.peers.state.name()
  }}, function (e, req, body) {
    // we should ignore the error because if it failed, then it's because we're propagating to a dead
    // peer and/or the network is partitioned. afd handles that
    if(e) return console.log('failed to propagate to peer %s', to.name())
    // identify the peers replied
    this.peers.identify(body)
    // signal that the peer we just connected with is alive
    to.beat()
  }.bind(this))
}

/**
 * handle `propagate` requests
 *
 * @param {http.IncomingMessage}
 * @param {http.ServerResponse}
 */
server.prototype.identifications = function (req, res) {
  // parse the connection body
  jsonmw(req, function (e, body, stream) {
    if(e) return utils.send(res, 500)
    // identify the peers we received
    this.peers.identify(body.identifications)
    // send the peers that the peer that is contacting us doesn't know
    res.end(JSON.stringify(this.peers.deltas(body.identifications)))
    // signal that the peer that is contactng us is alive
    this.peers.find(body.from).beat()
  }.bind(this))
}

/**
 * close the http.Server
 */
server.prototype.close = function () {
  // make sure the server is running
  if(this.server._handle) this.server.close()
}