var type = require('component-type'),
    http = require('http')

var utils = module.exports = {
  noop: function () {}
}

/**
 * gossip contructor arguments parser
 */
utils.args = function () {
  var args = {
    callback: utils.noop,
    seeds: []
  }

  Array.prototype.slice.apply(arguments).forEach(function (argument) {
    if(type(argument) === 'function') args.callback = argument
    if(type(argument) === 'object') args.server = argument
    if(Array.isArray(argument)) args.seeds = argument
  })

  if(args.server) args.srv_provided = true
  else args.server = http.createServer()

  return args
}

/**
 * transform an object into an array
 *
 * ```
 * util.values({
 *   key: 'value',
 *   key2: 'value2'
 * }) // -> ['value', 'value2']
 * ```
 *
 * @param {object}
 */
utils.values = function (object) {
  return Object.keys(object).map(function (key) {
    return object[key]
  })
}

/**
 * Reply to http.IncomingMessage with a defined body and statusCode
 *
 * ```
 * utils.send(200, JSON.stringify({
 *   hello: 'world'
 * }))
 * ```
 *
 * @param {http.ServerResponse} res
 * @param {number} status
 * @param {string} body
 */
utils.send = function (res, status, body) {
  if(type(val) !== 'number') {
    body = status
    status = 200
  }

  res.statusCode = status
  res.end(body)
}

/**
 * Generates an identification object for a peer
 *
 * @param {state} state
 * @returns {object} identification
 */
utils.identification = function (state) {
  return {
    port: state.port,
    hostname: state.hostname,
    name: state.name()
  }
}

/**
 * Transform a seed name into peer-state-compatible args
 *
 * ```
 * utils.seedit(['127.0.0.1:5646'])
 * // {
 * //   name: '127.0.0.1:5646',
 * //   seed: true,
 * //   local: false,
 * //   hostname: '127.0.0.1',
 * //   port: 5646
 * // }
 * ```
 *
 * @param {string} name
 * @returns {object} args
 */
utils.seedit = function (host) {
  return {
    name: host,
    seed: true,
    local: false,
    hostname: host.split(/\:/).shift(),
    port: Number(host.split(/\:/).pop())
  }
}