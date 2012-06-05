#!/bin/bash

which pegjs >/dev/null
if [ $? -gt 0 ]; then
	echo "Cannot find pegjs (npm install pegjs ?)"
	exit 1
fi

echo "Building PEGjs parser..."
pegjs --export-var parser --track-line-and-column parser.pegjs

echo "Creating IST module..."
LINE=$(grep -n "//PARSER//" ist_template.js | cut -d':' -f 1)
COUNT=$(cat ist_template.js | wc -l)

head -n $(($LINE-1)) ist_template.js >../dist/ist.js
cat parser.js >>../dist/ist.js
tail -n $(($COUNT-$LINE)) ist_template.js >>../dist/ist.js

which uglifyjs >/dev/null
if [ $? -gt 0 ]; then
	echo "UglifyJS not found, skipping compression (npm install uglify-js ?)"
	exit 0
fi

echo "Optimizing..."
uglifyjs -o ../dist/ist-min.js ../dist/ist.js

echo "All done !"

