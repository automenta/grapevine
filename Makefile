MOCHA=node_modules/.bin/mocha -u tdd -t 4000

test:
	$(MOCHA) -R spec

coverage:
	rm -rf src-cov
	jscoverage src src-cov
	@GOSSIP_COV=1 $(MOCHA) -R html-cov > test/coverage.html

.PHONY: test coverage