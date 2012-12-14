define(function() {
	return function (content) {
		return content.replace(/(['\\])/g, '\\$1')
			.replace(/[\f]/g, "\\f")
			.replace(/[\b]/g, "\\b")
			.replace(/[\t]/g, "\\t")
			.replace(/[\n]/g, "\\n")
			.replace(/[\r]/g, "\\r");
	};
});
