/*global define */
define(function() {
	'use strict';
	return function(id) {
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
	};
});
