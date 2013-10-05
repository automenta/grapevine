REPORTER = spec
UI = qunit
TESTS = test
TIMEOUT = 6000

test:
	@NODE_ENV=test ./node_modules/.bin/mocha -u $(UI) -R $(REPORTER) -t $(TIMEOUT) -c -G -b

lib-cov:
	./node_modules/jscoverage/bin/jscoverage src lib-cov

test-cov:	lib-cov
	@ASE_COVERAGE=1 $(MAKE) test REPORTER=html-cov > coverage.html
	rm -rf lib-cov

test-coveralls:	lib-cov
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@ASE_COVERAGE=1 $(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js
	rm -rf lib-cov

.PHONY: test