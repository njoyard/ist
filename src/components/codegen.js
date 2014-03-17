/*global define*/
define(['util/misc'], function(misc) {
	'use strict';

	var expressionRE = /{{\s*((?:}(?!})|[^}])*?)\s*}}/;

	// Set those to either empty string or '\n' and '\t' to toggle pretty code generation
	var NL = '';
	var TAB = '';

	var indent;

	var interpolateCache = {};
	var propertyCache = {};

	if (TAB.length && NL.length) {
		indent = function (code) {
			if (Array.isArray(code)) {
				return code.map(indent);
			} else {
				return TAB + code.split(NL).join(NL + TAB);
			}
		};
	} else {
		indent = function(c) { return c; };
	}


	/* Variables used in generated code :
		ist$e: error decorator
		ist$x: rendering context
		ist$d: directives module
		ist$l: current nodelist
		ist$n: current node
		ist$i: current template line number
		ist$s: context scope object
		ist$t: property setter target
		ist$c: property setter current pointer
		ist$v: property setter values
	 */
	var codegen = {
		// Returns code to evaluate expr
		evaluate: function(expr) {
			var cacheKey = '{{ ' + expr + ' }}';

			if (!(cacheKey in interpolateCache)) {
				var code = [
					TAB + 'if(this!==null&&this!==undefined){',
					TAB + TAB +'with(this){with(ist$s){return ' + expr + ';}}',
					TAB + '}else{',
					TAB + TAB + 'with(ist$s){return ' + expr + ';}',
					TAB + '}',
				].join(NL);

				var args = 'document,ist$s';

				// Try to compile function right away
				/*jshint evil:true*/
				new Function(args, code);

				interpolateCache[cacheKey] = [
					'ist$x.call(function(' + args + '){',
					code,
					'})'
				].join(NL);
			}

			return interpolateCache[cacheKey];
		},


		// Returns code to interpolate expressions in text
		interpolate: function(text) {
			if (!(text in interpolateCache)) {
				if (expressionRE.test(text)) {
					interpolateCache[text] = codegen.evaluate(
						text.split(expressionRE)
						.map(function(part, index) {
							if (index % 2) {
								// expression
								return '(' + part + ')';
							} else {
								// text literal
								return '\'' + misc.jsEscape(part) + '\'';
							}
						})
						.filter(function(part) {
							return part !== '\'\'';
						})
						.join('+')
					);
				} else {
					interpolateCache[text] = '\'' + misc.jsEscape(text) +'\'';
				}
			}

			return interpolateCache[text];
		},

		// Returns code to set a property path
		property: function prout(path) {
			var cacheKey = path.join('.');

			if (!(cacheKey in propertyCache)) {
				propertyCache[cacheKey] = [
						'function(ist$t,ist$v) {',
						TAB + 'var ist$c = ist$t;'
					]
					// Set intermediate properties to empty objects if not present
					.concat(indent(path.map(function(part, index) {
						if (index === path.length -1) {
							return 'ist$c["' + part + '"] = ist$v;';
						} else {
							return 'ist$c = ist$c["' + part + '"] = ist$c["' + part + '"] || {};';
						}
					})))
					.concat(['}'])
					.join(NL);
			}

			return propertyCache[cacheKey];
		},

		// Returns code to set current template line
		line: function(node) {
			return 'ist$i = ' + node.line + ';';
		},

		// Returns code to update element
		element: function(node) {
			var attributes = node.attributes || {};
			var properties = node.properties || [];
			var events = node.events || {};

			return [codegen.line(node)]
				// Set element attributes
				.concat(Object.keys(attributes).map(function(attr) {
					return [
						'ist$n.setAttribute(',
						TAB + '"' + attr + '",',
						TAB + '"" + ' + codegen.interpolate(attributes[attr]),
						');'
					].join(NL);
				}))
				// Set element properties
				.concat(properties.map(function(prop) {
					return '(' + codegen.property(prop.path) + ')(ist$n, ' + codegen.interpolate(prop.value) + ');';
				}))
				// Remove stored event handlers
				.concat([
					'ist$n.ist$handlers = ist$n.ist$handlers || {};',
					'Object.keys(ist$n.ist$handlers).forEach(function(evt) {',
					TAB + 'ist$n.removeEventListener(evt, ist$n.ist$handlers[evt], false);',
					TAB + 'delete ist$n.ist$handlers[evt];',
					'});'
				])
				// Store new event handlers
				.concat(Object.keys(events).map(function(evt) {
					return [
						'ist$n.ist$handlers["' + evt + '"] = ' + codegen.evaluate(events[evt]) + ';',
					].join(NL);
				}))
				// Apply stored event handlers
				.concat([
					'Object.keys(ist$n.ist$handlers).forEach(function(evt) {',
					TAB + 'ist$n.addEventListener(evt, ist$n.ist$handlers[evt], false);',
					'});'
				])
				.join(NL);
		},

		// Returns code to update text node
		text: function(node) {
			return [
				codegen.line(node),
				'ist$n.textContent = "" + ' + codegen.interpolate(node.text) + ';'
			].join(NL);
		},

		// Returns code to update directive nodes
		directive: function(node) {
			var evalExpr = node.expr ? codegen.evaluate(node.expr) : 'undefined';

			return [
				codegen.line(node),
				'if (!("keys" in ist$n)) {',
				// Setup fragment index on first render
				TAB + 'ist$n.keys = [];',
				TAB + 'ist$n.fragments = [];',
				'} else {',
				// Extract fragment index nodes from current nodelist
				TAB + 'ist$n.remove(ist$l);',
				'}',
				// Check for directive helper
				'if (!ist$d.has("' + node.directive + '")) {',
				TAB + 'throw new Error("No directive helper for @' + node.directive + ' has been registered");',
				'}',
				// Call directive helper
				'ist$d.get("' + node.directive + '")(ist$x, ' + evalExpr + ', ist$n.template, ist$n.iterator);',
				// Update current node
				'ist$n = ist$n.last() || ist$n;'
			].join(NL);
		},

		// Returns code to update child nodes
		children: function(code) {
			return ['(function(ist$l) {']
				.concat(indent(code))
				.concat(['})([].slice.call(ist$n.childNodes));'])
				.join(NL);
		},

		// Return code to switch to next node in a nodelist
		next: function() {
			return [
				'ist$n = ist$l.shift();'
			].join(NL);
		},

		// Returns wrapping code to update a nodelist	
		wrap: function(code) {
			return [
					'var ist$n;',
					'var ist$i;',
					'try {',
				]
				.concat(indent(code))
				.concat([
					TAB + 'return ist$n;',
					'} catch(e) {',
					TAB + 'throw ist$e(e, ist$i);',
					'}'
				])
				.join(NL);
		},

		compile: function(code) {
			/*jshint evil:true*/
			return new Function('ist$e,ist$d,ist$x,ist$l', Array.isArray(code) ? code.join(NL) : code);
		}
	};

	return codegen;
});