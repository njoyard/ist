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
				codeCache[cacheKey] = 'function(_istScope){' +
					'with(_istScope){' +
						'if(this!==null&&this!==undefined){' +
							'with(this){' +
								'return ' + expr + ';' +
							'}' +
						'}else{' +
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
				return new Function('_istScope',
					'return (' + this.expression(node.expr) + ').call(this,_istScope);'
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
						'(' + codegen.interpolation(attributes[attr]) + ').call(this,_istScope)' +
					');'
				);
			});

			Object.keys(properties).forEach(function(prop) {
				code.push(
					'element["' + prop + '"]=' +
						'(' + codegen.interpolation(properties[prop]) + ').call(this,_istScope);'
				);
			});

			Object.keys(events).forEach(function(evt) {
				code.push(
					'element.addEventListener(' +
						'"' + evt + '",' +
						'(' + codegen.expression(events[evt]) + ').call(this,_istScope),' +
						'false' +
					');'
				);
			});

			return new Function('_istScope,element', code.join(''));
		},

		textUpdater: function(node) {
			return new Function('_istScope,textNode',
				'textNode.textContent=(' + this.interpolation(node.text) + ').call(this,_istScope);'
			);
		}
	};
});