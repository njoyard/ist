/** @license
 * IST: Indented Selector Templating
 *
 * Copyright (c) 2012 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://njoyard.github.com/ist
 */
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
