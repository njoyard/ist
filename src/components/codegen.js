/*jshint evil:true */
/*global define*/
define(['util/misc'], function(misc) {
	'use strict';

	var expressionRE = /{{\s*((?:}(?!})|[^}])*?)\s*}}/,
		codeCache = {},
		undef = function() {};

	return {
		expression: function(expr) {
			var cacheKey = '{{ ' + expr + ' }}';

			if (!(cacheKey in codeCache)) {
				codeCache[cacheKey] = 'function(document,_istScope){' +
					'if(this!==null&&this!==undefined){' +
						'with(this){' +
							'with(_istScope){' +
								'return ' + expr + ';' +
							'}' +
						'}' +
					'}else{' +
						'with(_istScope){' +
							'return ' + expr + ';' +
						'}' +
					'}' +
				'}';
			}

			return codeCache[cacheKey];
		},

		interpolation: function(text) {
			if (!(text in codeCache)) {
				codeCache[text] = this.expression(
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

			return codeCache[text];
		},

		directiveEvaluator: function(node) {
			if ('expr' in node) {
				return new Function('document,_istScope',
					'return (' + this.expression(node.expr) + ').call(this,document,_istScope);'
				);
			} else {
				return undef;
			}
		},

		elementUpdater: function(node) {
			var code = [],
				codegen = this,
				attributes = node.attributes,
				properties = node.properties,
				events = node.events;

			Object.keys(attributes).forEach(function(attr) {
				code.push(
					'element.setAttribute(' +
						'"' + attr + '",' +
						'(' + codegen.interpolation(attributes[attr]) + ').call(this,document,_istScope)' +
					');'
				);
			});

			properties.forEach(function(prop) {
				var itcode = [];

				for (var i = 0, len = prop.path.length; i < len; i++) {
					var pathElement = prop.path[i];
					if (i === len - 1) {
						itcode.push(
							'current["' + pathElement + '"] = value;'
						);
					} else {
						itcode.push(
							'if (!("' + pathElement + '" in current)) {' +
								'current["' + pathElement + '"] = {};' +
							'}' +
							'current = current["' + pathElement + '"];'
						);
					}
				}

				code.push(
					'(function(value) {' +
						'var current = element;' +
						itcode.join('') +
					'})((' + codegen.interpolation(prop.value) + ').call(this,document,_istScope));'
				);
			});

			Object.keys(events).forEach(function(evt) {
				code.push(
					'element.addEventListener(' +
						'"' + evt + '",' +
						'(' + codegen.expression(events[evt]) + ').call(this,document,_istScope),' +
						'false' +
					');'
				);
			});

			return new Function('document,_istScope,element', code.join(''));
		},

		textUpdater: function(node) {
			return new Function('document,_istScope,textNode',
				'textNode.textContent=(' + this.interpolation(node.text) + ').call(this,document,_istScope);'
			);
		}
	};
});