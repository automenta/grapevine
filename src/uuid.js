var request = require('request'),
    crypto = require('crypto'),
    async = require('async'),
    dns = require('dns'),
    os = require('os')

var external = function (callback) {
  request('http://checkip.dyndns.org', function (e, res, body) {
    if(e) return callback(e)
    callback(e, body.match(/<body>Current IP Address: (.*?)<\/body>/)[1])
  })
}

var timestamp = function (callback) {
  callback(null, new Date().getTime())
}

var random = function (callback) {
  crypto.randomBytes(8, function(e, buf) {
    if(e) return callback(e)
    callback(e, buf.toString('hex'))
  })
}

var local = function (callback) {
  dns.lookup(os.hostname(), 4, function(e, ip) {
    callback(e, ip)
  })
}

module.exports = function (port, callback) {
  async.parallel([timestamp, external, random, local], function (e, result) {
    if(e) return callback(e)
    callback(e, crypto.createHash('md5').update(result.join(' ')).digest('hex'))
  })
}