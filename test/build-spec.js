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

	return function() {
		describe('[r.js built scripts]', function() {
			built.forEach(function(file) {
				it('should run ' + file, function() {
					var complete = false;

					var iframe = document.createElement('iframe');
					iframe.name = file;

					iframe.addEventListener('load', function() {
						var iframeWindow = window.frames[file];
						var iframeDoc = iframeWindow.document;

						iframeWindow.__run__ = function(testRunner) {
							testRunner(expect, function() {
								document.body.removeChild(iframe);
								complete = true;
							});
						};

						var istScript = iframeDoc.createElement('script');
						istScript.type = 'text/x-ist';
						istScript.id = 'scriptTag';
						istScript.innerHTML = 'div\n "{{ foo }}"';

						iframeDoc.body.appendChild(istScript);

						var requireScript = iframeDoc.createElement('script');
						requireScript.src = '/base/node_modules/requirejs/require.js';
						requireScript.setAttribute('data-main', file);
						iframeDoc.body.appendChild(requireScript);
					});
					
					runs(function() {
						iframe.src = 'about:blank';
						document.body.appendChild(iframe);
					});

					waitsFor(
						function() { return complete; },
						'built script ' + file,
						1000
					);
				});
			});
		});
	};
});