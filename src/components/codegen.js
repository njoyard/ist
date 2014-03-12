/*jshint evil:true */
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
		__e: error decorator
		__x: rendering context
		__d: directives module
		__l: current nodelist
		__n: current node
		__i: current template line number
		__s: context scope object
		__t: property setter target
		__c: property setter current pointer
		__v: property setter values
	 */
	var codegen = {
		// Returns code to evaluate expr
		evaluate: function(expr) {
			var cacheKey = '{{ ' + expr + ' }}';

			if (!(cacheKey in interpolateCache)) {
				var code = [
					TAB + 'if(this!==null&&this!==undefined){',
					TAB + TAB +'with(this){with(__s){return ' + expr + ';}}',
					TAB + '}else{',
					TAB + TAB + 'with(__s){return ' + expr + ';}',
					TAB + '}',
				].join(NL);

				var args = 'document,__s';

				// Try to compile function right away
				/*jshint evil:true*/
				new Function(args, code);

				interpolateCache[cacheKey] = [
					'__x.call(function(' + args + '){',
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
						'function(__t,__v) {',
						TAB + 'var __c = __t;'
					]
					.concat(indent(path.map(function(part, index) {
						if (index === path.length -1) {
							return '__c["' + part + '"] = __v;';
						} else {
							return '__c = __c["' + part + '"] = __c["' + part + '"] || {};';
						}
					})))
					.concat(['}'])
					.join(NL);
			}

			return propertyCache[cacheKey];
		},

		// Returns code to set current template line
		line: function(node) {
			return '__i = ' + node.line + ';';
		},

		// Returns code to update element
		element: function(node) {
			var attributes = node.attributes;
			var properties = node.properties;
			var events = node.events;

			return [codegen.line(node)]
				.concat(Object.keys(attributes).map(function(attr) {
					return [
						'__n.setAttribute(',
						TAB + '"' + attr + '",',
						TAB + codegen.interpolate(attributes[attr]),
						');'
					].join(NL);
				}))
				.concat(properties.map(function(prop) {
					return '(' + codegen.property(prop.path) + ')(__n, ' + codegen.interpolate(prop.value) + ');';
				}))
				.concat(Object.keys(events).map(function(evt) {
					return [
						'__n.addEventListener(',
						TAB + '"' + evt + '",',
						TAB + codegen.evaluate(events[evt]) + ',',
						TAB + 'false',
						');'
					].join(NL);
				}))
				.join(NL);
		},

		// Returns code to update text node
		text: function(node) {
			return [
				codegen.line(node),
				'__n.textContent = ' + codegen.interpolate(node.text) + ';'
			].join(NL);
		},

		// Returns code to update directive nodes
		directive: function(node) {
			var evalExpr = node.expr ? codegen.evaluate(node.expr) : 'undefined';

			return [
				codegen.line(node),
				'if (!("keys" in __n)) {',
				TAB + '__n.keys = [];',
				TAB + '__n.fragments = [];',
				'}',
				'if (!__d.has("' + node.directive + '")) {',
				TAB + 'throw new Error("No directive helper for @' + node.directive + ' has been registered");',
				'}',
				'__d.get("' + node.directive + '")(__x, ' + evalExpr + ', __n.template, __n.iterator);',
				'__n = __n.iterator.last() || __n;'
			].join(NL);
		},

		// Returns code to update child nodes
		children: function(code) {
			return ['(function(__l) {']
				.concat(indent(code))
				.concat(['})([].slice.call(__n.childNodes));'])
				.join(NL);
		},

		// Return code to switch to next node in a nodelist
		next: function() {
			return [
				'__n = __l.shift();'
			].join(NL);
		},

		// Returns wrapping code to update a nodelist	
		wrap: function(code) {
			return [
					'var __n;',
					'var __i;',
					'try {',
				]
				.concat(indent(code))
				.concat([
					TAB + 'return __n;',
					'} catch(e) {',
					TAB + 'throw __e(e, __i);',
					'}'
				])
				.join(NL);
		}
	};

	return codegen;
});