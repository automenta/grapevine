if(process.env['GOSSIP_COV']) {
  var AccrualFailureDetector = require('../src-cov/accrual_failure_detector').AccrualFailureDetector;
} else {
  var AccrualFailureDetector = require('../src/accrual_failure_detector').AccrualFailureDetector;
}

var assert = require('chai').assert

suite('accrual_failure_detector', function () {
  test('should have a low phi value after only a second', function () {
    var afd = new AccrualFailureDetector();
    var time = 0;
    for(var i = 0;i < 100;i++) {
      time += 1000;
      afd.add(time);
    }
    assert.ok(afd.phi(time + 1000) < 0.5);
  })

  test('should have a high phi value after ten seconds', function () {
    var afd = new AccrualFailureDetector();
    var time = 0;
    for(var i = 0;i < 100;i++) {
      time += 1000;
      afd.add(time);
    }
    assert.ok(afd.phi(time + 10000) > 4);
  })

  test('should only keep last 1000 values', function () {
    var afd = new AccrualFailureDetector();
    var time = 0;
    for(var i = 0;i < 2000;i++) {
      time += 1000;
      afd.add(time);
    }
    assert.equal(1000, afd.intervals.length);
  })
})