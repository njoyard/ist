PEGJS=pegjs
PEGJSFLAGS=--export-var parser --track-line-and-column
UGLIFYJS=uglifyjs

all: ist ist-min

@PHONY: test_pegjs
test_pegjs:
	@which $(PEGJS) >/dev/null || ( echo "PEGjs not found (npm install pegjs ?)" && exit 1 )

@PHONY: test_uglifyjs
test_uglifyjs:
	@which $(UGLIFYJS) >/dev/null || ( echo "Uglify-js not found (run 'make ist' to ignore uglifying)" && exit 1 )

@PHONY: clean
clean:
	@rm -f src/parser.js
	@rm -rf dist

dist:
	mkdir -p dist

src/parser.js: test_pegjs src/parser.pegjs
	$(PEGJS) $(PEGJSFLAGS) src/parser.pegjs src/parser.js
	
ist: dist/ist.js
dist/ist.js: dist src/ist_template.js src/parser.js
	sed "\;// PEGjs parser start; r src/parser.js" src/ist_template.js > dist/ist.js

ist-min: test_uglifyjs dist/ist-min.js
dist/ist-min.js: dist dist/ist.js
	$(UGLIFYJS) -o dist/ist-min.js dist/ist.js

