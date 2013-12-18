/*jshint browser:true*/
/*global define, describe, it, expect, runs, waitsFor */

define([], function() {
	'use strict';

	var built = [];

	for (var file in window.__karma__.files) {
		if (window.__karma__.files.hasOwnProperty(file)) {
			if (/build\/.*.out.js$/.test(file)) {
				built.push(file);
			}
		}
	}

	describe('build', function() {
		built.forEach(function(file) {
			it('should run ' + file, function() {
				var complete = false;
				function done() { complete = true; }

				runs(function() {
					var iframe = document.createElement('iframe');
					iframe.name = file;
					iframe.src = 'about:blank';
					document.body.appendChild(iframe);

					var iframeWindow = window.frames[file];
					var iframeDoc = iframeWindow.document;

					iframeWindow.__run__ = function(testRunner) {
						testRunner(expect, done);
					};

					var istScript = iframeDoc.createElement('script');
					istScript.type = 'text/x-ist';
					istScript.id = 'scriptTag';
					istScript.innerHTML = 'div\n "{{ foo }}"';

					iframeDoc.body.appendChild(istScript);

					var requireScript = iframeDoc.createElement('script');
					requireScript.src = '/base/node_modules/requirejs/require.js';
					requireScript.dataset.main = file;

					iframeDoc.body.appendChild(requireScript);
				});

				waitsFor(
					function() { return complete; },
					1000,
					'built script ' + file
				);
			});
		});
	});
});