/**
 * Accrual Failure Detector
 * @module gossip/afd
 */


/**
 * @constructor
 */
var afd = function () {
  this.intervals = []
  this.last = 750
}

/**
 * Add a new time
 * @param {Number} time
 */
afd.prototype.add = function (time) {
  if(this.intervals.length > 999) this.intervals.shift()
  this.intervals.push(time - this.last)
  this.last = time
}

/**
 * Get the current phi
 * @param {Number} time
 */
afd.prototype.phi = function () {
  var time = new Date().getTime()
  var interval = time - this.last
  var p = Math.pow(Math.E, -1 * interval / this.mean())
  
  return -1 * (Math.log(p) / Math.log(10))
}

/**
 * Get the mean interval
 * @param {Number} mean
 */
afd.prototype.mean = function () {
  var sum = this.intervals.reduce(function (prev, curr) {
    return prev + curr
  })

  return sum / this.intervals.length
}


/**
 * Exports the afd constructor
 */
module.exports = function (name, local) {
  return new afd()
}