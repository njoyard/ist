define(function() {
	var newlines = /\r\n|\r|\n/,
		whitespace = /^[ \t]*$/,
		comment = /\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g,
		removeComment, removeWhitespace;

	removeComment = function(m, p1) {
		return p1.split(newlines).map(function() { return ""; }).join("\n");
	};

	removeWhitespace = function(l) {
		return l.match(whitespace) ? "" : l;
	};

	/**
	 * Template preprocessor; handle what the parser cannot handle
	 * - Make whitespace-only lines empty
	 * - Remove block-comments (keeping line count)
	 * - Remove escaped line breaks
	 */
	return function(text) {
		return text
			// Remove block comments
			.replace(comment, removeComment)

			.split(newlines)

			// Remove everthing from whitespace-only lines
			.map(removeWhitespace)

			// Remove escaped line breaks
			.reduce(function(lines, line) {
				if (lines.length) {
					var prevline = lines[lines.length - 1];
					if (prevline[prevline.length - 1] === "\\") {
						lines[lines.length - 1] = prevline.replace(/\s*\\$/, "") + line.replace(/^\s*/, "");
					} else {
						lines.push(line);
					}
				} else {
					lines.push(line);
				}

				return lines;
			}, [])

			.join("\n");
	};
});
