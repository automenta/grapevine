var puid = require('puid'),
    utils = module.exports = {}

utils.noop = function () {}

/**
 * gossip contructor arguments parser
 */
utils.args = function () {
  var args = {
    callback: utils.noop,
    id: new puid(),
    seeds: [],
    port: 0
  }

  Array.prototype.slice.apply(arguments).forEach(function (argument) {
    if(typeof argument === 'function') args.callback = argument
    if(typeof argument === 'number') args.port = argument
    if(typeof argument === 'string') args.id = argument
    if(Array.isArray(argument)) args.seeds = argument
  })
  
  return args
}

/**
 * Timers management
 */
utils.timers = function (gossip, beat) {
  if(!(this instanceof utils.timers))
    return new utils.timers(gossip, beat)
  
  var interval = 1000
  var intervals = {}

  this.start = function () {
    intervals.gossip = setInterval(function () {
      gossip()
    }, interval)
    
    intervals.beat = setInterval(function () {
      beat()
    }, interval)
  }

  this.stop = function () {
    utils.values(self.intervals).forEach(clearInterval)
  }
}

/**
 * transform an object into an array
 */
utils.values = function(object) {
  return Object.keys(object).map(function (key) {
    return object[key]
  })
}



/******************************************************************************/
/*

var utils = module.exports = {
  noop: function () {},
  request: 'REQUEST',
  response: {
    first: 'FIRST_RESPONSE',
    second: 'SECOND_RESPONSE'
  }
}

utils.to = utils.noop



utils.compact = function (value) {
  return !!value
}

utils.forEach = function (ar, self, callback) {
  ar.forEach(function (el, i) {
    callback(el, i, self)
  })
}

utils.bubble = function (from, dest) {
  from.onAny(function () {
    var args = Array.prototype.slice(arguments)
    var ev = args.shift()
    dest.emit.apply(dest, ev, args)
  })
}

utils.fall = function (evs, from, dest) {
  evs.forEach(function (ev) {
    from.on(ev, function () {
      dest.emit.apply(dest, ev, arguments)
    })
  })
}


*/