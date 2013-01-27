module.exports = function (n, callback) {
  for(var i = 0; i < n; i++) {
    callback(i)
  }
}