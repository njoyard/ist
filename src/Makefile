PEGJS=pegjs
PEGJSFLAGS=--export-var pegjsParser --track-line-and-column
RJS=r.js

BUILDDIR=../dist

RJSCONFIG=ist.build.js
COMPONENTS=$(wildcard components/*.js)
PARSER=parser/parser.js parser/preprocessor.js
UTIL=$(wildcard util/*.js)

SOURCE=ist.js $(COMPONENTS) $(PARSER) $(UTIL)

all: ist ist-min

$(BUILDDIR):
	mkdir -p $(BUILDDIR) 

parser/parser.compiled.js: parser/parser.pegjs
	$(PEGJS) $(PEGJSFLAGS) $< $@

parser/parser.js: parts/parser.header.part parser/parser.compiled.js parts/parser.footer.part
	cat $^ > $@

$(BUILDDIR)/ist.js: $(BUILDDIR) $(RJSCONFIG) $(SOURCE)
	$(RJS) -o $(RJSCONFIG) out=$@ optimize=none
	
$(BUILDDIR)/ist-min.js: $(BUILDDIR) $(RJSCONFIG) $(SOURCE)
	$(RJS) -o $(RJSCONFIG) out=$@

@PHONY: ist
ist: $(BUILDDIR)/ist.js

@PHONY: ist-min
ist-min: $(BUILDDIR)/ist-min.js

@PHONY: clean
clean:
	@rm parser/parser.compiled.js
	@rm -rf $(BUILDDIR) 

