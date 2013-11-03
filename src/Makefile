PEGJS=pegjs
PEGJSFLAGS=--export-var pegjsParser --track-line-and-column
RJS=r.js

DESTDIR=..

RJSCONFIG=ist.build.js
COMPONENTS=$(wildcard components/*.js)
PARSER=parser/parsehelpers.js parser/parser.js parser/preprocessor.js
UTIL=$(wildcard util/*.js)
PARTS=$(wildcard parts/build.*.part)

SOURCE=ist.js $(COMPONENTS) $(PARSER) $(UTIL)

all: ist ist-min

$(DESTDIR):
	mkdir -p $(DESTDIR) 

parser/parser.compiled.js: parser/parser.pegjs
	$(PEGJS) $(PEGJSFLAGS) $< $@

parser/parser.js: parts/parser.header.part parser/parser.compiled.js parts/parser.footer.part
	cat $^ > $@

$(DESTDIR)/ist.js: $(RJSCONFIG) $(SOURCE) $(PARTS) | $(DESTDIR)
	$(RJS) -o $(RJSCONFIG) out=$@ optimize=none
	
$(DESTDIR)/ist-min.js: $(RJSCONFIG) $(SOURCE) $(PARTS) | $(DESTDIR)
	$(RJS) -o $(RJSCONFIG) out=$@

@PHONY: ist
ist: $(DESTDIR)/ist.js

@PHONY: ist-min
ist-min: $(DESTDIR)/ist-min.js

@PHONY: clean
clean:
	@rm parser/parser.compiled.js
	@rm parser/parser.js
