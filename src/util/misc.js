/*global define */
define(function() {
	'use strict';
	
	return {
		jsEscape: function (content) {
			return content.replace(/(['\\])/g, '\\$1')
				.replace(/[\f]/g, '\\f')
				.replace(/[\b]/g, '\\b')
				.replace(/[\t]/g, '\\t')
				.replace(/[\n]/g, '\\n')
				.replace(/[\r]/g, '\\r');
		},

		findScript: function(id) {
			var i, len, s, found, scripts;

			try {
				scripts = document.querySelectorAll('script#' + id);
			} catch(e) {
				// DOM exception when selector is invalid - no <script> tag with this id
				return;
			}
				
			if (scripts) {
				for (i = 0, len = scripts.length; i < len; i++) {
					s = scripts[i];
					if (s.getAttribute('type') === 'text/x-ist') {
						return s.innerHTML;
					}
				}
			}
			
			return found;
		}
	};
});
