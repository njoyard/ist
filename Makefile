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

test: buildtests functests

@PHONY: test-dev
test-dev: buildtests functests-dev

@PHONY: test-travis
test-travis: buildtests functests-travis

# r.js building tests

RJS=node_modules/.bin/r.js
RJSCONFS=$(wildcard test/build/*.build.js)
RJSOUTS=$(patsubst %.build.js,%.out.js,$(RJSCONFS))

@PHONY: buildtests
buildtests: ist $(RJSOUTS)

$(RJSOUTS): %.out.js:%.main.js
$(RJSOUTS): %.out.js:%.build.js ist.js
	$(RJS) -o $<

# Functional tests

KARMA=node_modules/.bin/karma
KARMACONF=test/karma-conf.js
KARMASAUCECONF=test/karma-sauce-conf.js

@PHONY: functests
functests: ist
	$(KARMA) start $(KARMACONF)

@PHONY: functests-dev
functests-dev: ist
	$(KARMA) start $(KARMACONF) --single-run=false --auto-watch=true --browsers= 

# Test browsers separately
SAUCEBROWSERS=ie11 safari_osx chrome_linux chrome_windows chrome_osx firefox_linux firefox_windows firefox_osx opera_linux opera_windows

@PHONY: $(SAUCEBROWSERS)
$(SAUCEBROWSERS):
	$(KARMA) start $(KARMASAUCECONF) --browsers=sl_$@

@PHONY: functests-travis
functests-travis: ist $(SAUCEBROWSERS)