/*jshint browser:true*/
/*global require, beforeEach*/

(function() {
'use strict';

	/* List test specs */
	var tests = [];
	for (var file in window.__karma__.files) {
		if (window.__karma__.files.hasOwnProperty(file)) {
			if (/-spec\.js$/.test(file)) {
				tests.push(file);
			}
		}
	}

	/* Setup requirejs */
	require.config({
		baseUrl: '/base',
		paths: {
			'text': 'test/lib/text'
		}
	});

	/* Add test script tag */
	var script = document.createElement("script");
	script.setAttribute("type", "text/x-ist");
	script.setAttribute("id", "scriptTag");
	script.innerHTML = ["\tdiv.insideScriptTag", "\t\tdiv.child", "\t\t\t@if variable === \"value\"", "\t\t\t\tdiv.conditional"].join("\n");
	document.body.appendChild(script);

	require(['ist'].concat(tests), function(ist) {
		/* Setup custom jasmine matchers */
		beforeEach(function() {
			var matchers = {};

			matchers.toThrowAny = function(messages) {
				var thrown;
				
				this.message = function() {
					var actual;
					
					if (thrown) {
						actual = 'it threw \'' + thrown + '\'';
					} else {
						actual = 'it didn\'t throw any exception';
					}
					
					return 'Expected function to throw any of ' + messages.map(function(m) { return '\'' + m + '\''; }).join(', ') + ' but ' + actual;
				};
				
				try {
					this.actual();
				} catch(e) {
					thrown = e.message || e;
				}
				
				return typeof thrown !== 'undefined' && messages.indexOf(thrown) != -1;
			};

			matchers.toParse = function() {
				var template = this.actual,
					err;

				this.message = function() {
					return 'Expected successful parsing but caught \'' + err.message + '\'';
				};
			
				try {
					ist(template);
				} catch (e) {
					err = e;
				}
			
				return typeof err === 'undefined';
			};

			matchers.toFailParse = function(message) {
				var template = this.actual,
					err;
			
				this.message = function() {
					var actual;
				
					if (typeof err === 'undefined') {
						actual = 'parsing succeeded';
					} else {
						actual = 'caught \'' + err.message + '\' instead';
					}
				
					return 'Expected parse failure \'' + message + '\' but ' + actual;
				};
			
				try {
					ist(template);
				} catch (e) {
					err = e;
				}
			
				return typeof err !== 'undefined' && err.message === message;
			};

			matchers.toRender = function(context) {
				var template = this.actual,
					err;
			
				this.message = function() {
					return 'Expected successful rendering but caught \'' + err.message + '\'';
				};
			
				try {
					template.render(context);
				} catch (e) {
					err = e;
				}
			
				return typeof err === 'undefined';
			};

			matchers.toFailRender = function(context, message) {
				var template = this.actual,
					err;
			
				this.message = function() {
					var actual;
				
					if (typeof err === 'undefined') {
						actual = 'rendering succeeded';
					} else {
						actual = 'caught \'' + err.message + '\' instead';
					}
				
					return 'Expected render failure \'' + message + '\' but ' + actual;
				};
			
				try {
					template.render(context);
				} catch (e) {
					err = e;
				}
			
				return typeof err !== 'undefined' && err.message === message;
			};
			
			matchers.toBeInDocument = function(doc) {
				var actual = this.actual.ownerDocument;
				
				this.message = function() {
					return 'Unexpected owner document';
				};
				
				return actual === doc;
			};

			matchers.toHaveNodeType = function(nodeType) {
				var actual = this.actual.nodeType;
			
				this.message = function() {
					return 'Expected node type ' + nodeType + ' instead of ' + actual;
				};
			
				return actual === nodeType;
			};

			matchers.toBeElement = function(tagName) {
				var actual = this.actual.tagName;
				
				this.message = function() {
					return 'Expected <' + tagName + '> element instead of <' + actual + '>';
				};
			
				return actual.toLowerCase() === tagName.toLowerCase();
			};

			matchers.toHaveTextContent = function(textContent) {
				var actual = this.actual.textContent;
				
				this.message = function() {
					return 'Expected text content \'' + textContent + '\' instead of \'' + actual + '\'';
				};
			
				return actual === textContent;
			};
			
			matchers.toBeSameNodeAs = function(node) {
				var actual = this.actual;
				
				this.message = function() {
					return 'Expected ' + actual + ' to be same node as ' + node;
				};
				
				return actual.isSameNode(node);
			};

			this.addMatchers(matchers);
		});

		window.__karma__.start();
	});
}());
