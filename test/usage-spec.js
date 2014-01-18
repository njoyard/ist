/*jshint browser:true*/
/*global define, describe, it, expect, runs, waitsFor*/

define(['text!test/usage/standalone-template.ist'], function(templateText) {
	'use strict';

	return function(configName) {
		describe('[Standalone usage]', function() {
			it('should work when ' + configName + '.js is loaded as a standalone script', function() {
				var complete = false;
				
				var iframe = document.createElement('iframe');
				iframe.name = 'standalone';

				iframe.addEventListener('load', function() {
					var ifw = window.frames.standalone;
				
					if (!ifw) {
						throw new Error('Cannot find standalone iframe');
					}

					var doc = ifw.document;

					/* Add script to set a value to window.ist */
					var setWindowIst = doc.createElement('script');
					setWindowIst.innerHTML = 'window.ist = "previous ist value";';
					doc.body.appendChild(setWindowIst);

					/* Load ist.js */
					var istjs = doc.createElement('script');

					istjs.addEventListener('load', function() {
						/* Add template script tag */
						var template = doc.createElement('script');
						template.type = 'text/x-ist';
						template.id = 'template1';
						template.innerHTML = templateText;
						doc.body.appendChild(template);

						/* Add script to define test functions */
						var testScript = doc.createElement('script');
					
						testScript.addEventListener('load', function() {
							ifw.__run__(expect, function() {
								document.body.removeChild(iframe);
								complete = true;
							});
						});
						
						testScript.src = '/base/test/usage/standalone-script.js';
						doc.body.appendChild(testScript);
					});

					istjs.src = '/base/' + configName + '.js';
					doc.body.appendChild(istjs);
				});

				runs(function() {
					iframe.src = 'about:blank';
					document.body.appendChild(iframe);
				});
					
				waitsFor(
					function() { return complete; },
					1000,
					'standalone iframe load timeout'
				);
			});
		});
	};
});
