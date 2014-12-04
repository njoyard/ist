/*global define, console */
define(function() {
	'use strict';

	return {
		warn: (function() {
			if (console) {
				if (console.warn) {
					return function(msg) { console.warn(msg); };
				}

				if (console.log) {
					return function(msg) { console.log(msg); };
				}
			}

			return function() {};
		}()),

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
		},

		iterateNodelist: function(firstChild, lastChild, callback) {
			var node = firstChild,
				end = lastChild ? lastChild.nextSibling : null,
				next;

			while (node && node !== end) {
				next = node.nextSibling;
				callback(node);
				node = next;
			}
		},

		buildNodelist: function(firstChild, lastChild) {
			var list = [];
			this.iterateNodelist(firstChild, lastChild, function(node) {
				list.push(node);
			});
			return list;
		},

		removeNodelist: function(firstChild, lastChild) {
			this.iterateNodelist(firstChild, lastChild, function(node) {
				node.parentNode.removeChild(node);
			});
		}
	};
});
