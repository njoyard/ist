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
	@rm test/build/*.build.js
	@rm test/build/*.out.js

## Tests

test: buildtests functests

@PHONY: test-dev
test-dev: buildtests functests-dev

@PHONY: test-travis
test-travis: buildtests functests-travis

# r.js building tests

RJS=node_modules/.bin/r.js

BUILDMAINS=$(wildcard test/build/*.main.js)

BUILDTEMPLATE=test/build/build.js.in
BUILDTEMPLATE_MIN=test/build/build-min.js.in

BUILDCONFS=$(patsubst %.main.js,%.build.js,$(BUILDMAINS))
BUILDCONFS_MIN=$(patsubst %.main.js,%-min.build.js,$(BUILDMAINS))

BUILDOUTS=$(patsubst %.main.js,%.out.js,$(BUILDMAINS))
BUILDOUTS_MIN=$(patsubst %.main.js,%-min.out.js,$(BUILDMAINS))

@PHONY: buildtests
buildtests: ist ist-min $(BUILDOUTS) $(BUILDOUTS_MIN)

$(BUILDOUTS): %.out.js:%.main.js
$(BUILDOUTS): %.out.js:%.build.js ist.js
	$(RJS) -o $<

$(BUILDOUTS_MIN): %-min.out.js:%.main.js
$(BUILDOUTS_MIN): %-min.out.js:%-min.build.js ist-min.js
	$(RJS) -o $<

$(BUILDCONFS): $(BUILDTEMPLATE)
	cat $(BUILDTEMPLATE) | sed -r "s:%NAME%:$(patsubst test/build/%.build.js,%,$@):g" > $@

$(BUILDCONFS_MIN): $(BUILDTEMPLATE_MIN)
	cat $(BUILDTEMPLATE_MIN) | sed -r "s:%NAME%:$(patsubst test/build/%-min.build.js,%,$@):g" > $@

# Functional tests

KARMA=node_modules/.bin/karma
KARMACONF=test/karma-conf.js
KARMASAUCECONF=test/karma-sauce-conf.js

@PHONY: functests
functests: ist ist-min
	$(KARMA) start $(KARMACONF)

@PHONY: functests-dev
functests-dev: ist ist-min
	$(KARMA) start $(KARMACONF) --single-run=false --auto-watch=true --browsers= 

# Test browsers separately (Sauce Labs limits concurrent tests, plus Karma
# sometimes timeouts waiting for browsers when several of them are running)
SAUCEBROWSERS=ie10 ie11 safari_osx chrome_linux chrome_windows chrome_osx firefox_linux firefox_windows firefox_osx opera_linux opera_windows

@PHONY: $(SAUCEBROWSERS)
$(SAUCEBROWSERS):
	$(KARMA) start $(KARMASAUCECONF) --browsers=sl_$@

@PHONY: functests-travis
functests-travis: ist $(SAUCEBROWSERS)