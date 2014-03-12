/*jshint evil:true */
/*global define*/
define(['util/misc'], function(misc) {
	'use strict';

	var expressionRE = /{{\s*((?:}(?!})|[^}])*?)\s*}}/;

	// Set those to either empty string or '\n' and '\t' to toggle pretty code generation
	var NL = '\n';
	var TAB = '\t';

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


	var codegen = {
		// Returns code to evaluate expr
		evaluate: function(expr) {
			var cacheKey = '{{ ' + expr + ' }}';

			if (!(cacheKey in interpolateCache)) {
				var code = [
					TAB + 'if(this!==null&&this!==undefined){',
					TAB + TAB +'with(this){with(__scope){return ' + expr + ';}}',
					TAB + '}else{',
					TAB + TAB + 'with(__scope){return ' + expr + ';}',
					TAB + '}',
				].join(NL);

				var args = 'document,__scope';

				// Try to compile function right away
				/*jshint evil:true*/
				new Function(args, code);

				interpolateCache[cacheKey] = [
					'function(' + args + '){',
					code,
					'}'
				].join(NL);
			}

			return interpolateCache[cacheKey];
		},


		// Returns code to interpolate expressions in text
		interpolate: function(text) {
			if (!(text in interpolateCache)) {
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
			}

			return interpolateCache[text];
		},

		// Returns code to set a property path
		property: function prout(path) {
			var cacheKey = path.join('.');

			if (!(cacheKey in propertyCache)) {
				propertyCache[cacheKey] = [
						'function(__target,__value) {',
						TAB + 'var __current = __target;'
					]
					.concat(indent(path.map(function(part, index) {
						if (index === path.length -1) {
							return '__current["' + part + '"] = __value;';
						} else {
							return '__current = __current["' + part + '"] = __current["' + part + '"] || {};';
						}
					})))
					.concat(['}'])
					.join(NL);
			}

			return propertyCache[cacheKey];
		},

		// Returns code to set current template line
		line: function(node) {
			return '__line = ' + node.line + ';';
		},

		// Returns code to update element
		element: function(node) {
			var attributes = node.attributes;
			var properties = node.properties;
			var events = node.events;

			return [codegen.line(node)]
				.concat(Object.keys(attributes).map(function(attr) {
					return [
						'__node.setAttribute(',
						TAB + '"' + attr + '",',
						TAB + '__ctx.call(' + codegen.interpolate(attributes[attr]) + ')',
						');'
					].join(NL);
				}))
				.concat(properties.map(function(prop) {
					return '(' + codegen.property(prop.path) + ')(__node, __ctx.call(' + codegen.interpolate(prop.value) + '));';
				}))
				.concat(Object.keys(events).map(function(evt) {
					return [
						'__node.addEventListener(',
						TAB + '"' + evt + '",',
						TAB + '__ctx.call(' + codegen.evaluate(events[evt]) + '),',
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
				'__node.textContent = __ctx.call(' + codegen.interpolate(node.text) + ');'
			].join(NL);
		},

		// Returns code to update directive nodes
		directive: function(node) {
			var evalExpr = node.expr ? '__ctx.call(' + codegen.evaluate(node.expr) + ')' : 'undefined';

			return [
				codegen.line(node),
				'if (!("keys" in __node)) {',
				TAB + '__node.keys = [];',
				TAB + '__node.fragments = [];',
				'}',
				'if (!__directives.has("' + node.directive + '")) {',
				TAB + 'throw new Error("No directive helper for @' + node.directive + ' has been registered");',
				'}',
				'__directives.get("' + node.directive + '")(__ctx, ' + evalExpr + ', __node.template, __node.iterator);',
				'__node = __node.iterator.last() || __node;'
			].join(NL);
		},

		// Returns code to update child nodes
		children: function(code) {
			return ['(function(__nodelist) {']
				.concat(indent(code))
				.concat(['})([].slice.call(__node.childNodes));'])
				.join(NL);
		},

		// Return code to switch to next node in a nodelist
		next: function() {
			return [
				'__node = __nodelist.shift();'
			].join(NL);
		},

		// Returns wrapping code to update a nodelist	
		wrap: function(code) {
			return [
					'var __node;',
					'var __line;',
					'try {',
				]
				.concat(indent(code))
				.concat([
					TAB + 'return __node;',
					'} catch(e) {',
					TAB + 'throw __error(e, __line);',
					'}'
				])
				.join(NL);
		}
	};

	return codegen;
});