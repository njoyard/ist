all: ist ist-min

## Distribution

@PHONY: ist
ist:
	make -C src ist
	
@PHONY: ist-min
ist-min:
	make -C src ist-min
	
@PHONY: clean
clean:
	make -C src clean
	@rm test/build/*.out.js

## Tests

@PHONY: tests
tests: buildtests functests

# r.js building tests

RJS=node_modules/.bin/r.js
RJSCONFS=$(wildcard test/build/*.build.js)
RJSOUTS=$(patsubst %.build.js,%.out.js,$(RJSCONFS))

@PHONY: buildtests
buildtests: $(RJSOUTS)

$(RJSOUTS): %.out.js:%.main.js
$(RJSOUTS): %.out.js:%.build.js ist.js
	$(RJS) -o $<

# Functional tests

KARMA=node_modules/.bin/karma
KARMACONF=test/karma-conf.js

@PHONY: functests
functests:
	$(KARMA) start $(KARMACONF)
