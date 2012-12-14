default:
	make -C src

@PHONY: ist
ist:
	make -C src ist
	
@PHONY: ist-min
ist-min:
	make -C src ist-min
	
@PHONY: clean
clean:
	make -C src clean
