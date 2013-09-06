define(function() {
	var newlines = /\r\n|\r|\n/,
		whitespace = /^[ \t]*$/,
		comment = /\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g,
		removeComment, removeWhitespace;

	removeComment = function(m, p1) {
		return p1.split(newlines).map(function(l) { return ''; }).join('\n');
	};

	removeWhitespace = function(l) {
		return l.match(whitespace) ? "" : l;
	};

	/**
	 * Template preprocessor; handle what the parser cannot handle
	 * - Make whitespace-only lines empty
	 * - Remove block-comments (keeping line count)
	 */	
	return function(text) {
		var lines;

		// Remove block comments
		text = text.replace(comment, removeComment); 

		// Remove everthing from whitespace-only lines
		text = text.split(newlines).map(removeWhitespace).join('\n');

		return text;
	};
});
