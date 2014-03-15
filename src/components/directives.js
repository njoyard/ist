/*global define */
define(function() {
	'use strict';

	var directives, registered,
		defined = {};
	
	/**
	 * Conditional helper for @if, @unless
	 *
	 * @param {Context} ctx rendering context
	 * @param render render template if truthy
	 * @param {Template} tmpl template to render
	 * @param {Function} iterate directive iterator
	 */
	function conditionalHelper(ctx, render, tmpl, iterate) {
		iterate(function(key, rendered) {
			if (render) {
				if (rendered) {
					rendered.update(ctx);
				} else {
					return tmpl.render(ctx);
				}
			} else {
				if (rendered) {
					rendered.clear();
				}
			}
		});
	}

	
	/**
	 * Iteration helper for @each, @eachkey
	 *
	 * @param {Context} ctx rendering context
	 * @param {Array} items item array to iterate over
	 * @param {Array} keys item identifiers
	 * @param [loopAdd] additional loop properties
	 * @param {Template} tmpl template to render for each item
	 * @param {Function} iterate directive iterator
	 */
	function iterationHelper(ctx, items, keys, loopAdd, tmpl, iterate) {
		var outerValue = ctx.value;

		iterate(keys, function(key, rendered) {
			var index = keys.indexOf(key);
			var item = items[keys.indexOf(key)];

			ctx.pushValue(item);

			var loop = {
				first: index === 0,
				index: index,
				last: index == items.length - 1,
				length: items.length,
				outer: outerValue
			};

			if (loopAdd) {
				Object.keys(loopAdd).forEach(function(key) {
					loop[key] = loopAdd[key];
				});
			}

			ctx.pushScope({ loop: loop });

			if (rendered) {
				rendered.update(ctx);
			} else {
				rendered = tmpl.render(ctx);
			}

			ctx.popScope();
			ctx.popValue();

			return rendered;
		});
	}
	
	
	/* Built-in directive helpers (except @include and @else) */
	registered = {
		'if': function ifHelper(ctx, value, tmpl, iterate) {
			conditionalHelper(ctx, value, tmpl, iterate);
		},

		'unless': function unlessHelper(ctx, value, tmpl, iterate) {
			conditionalHelper(ctx, !value, tmpl, iterate);
		},

		'with': function withHelper(ctx, value, tmpl, iterate) {
			iterate(function(key, rendered) {
				ctx.pushValue(value);

				if (rendered) {
					rendered.update(ctx);
				} else {
					rendered = tmpl.render(ctx);
				}

				ctx.popValue();

				return rendered;
			});
		},

		'each': function eachHelper(ctx, value, tmpl, iterate) {
			if (!Array.isArray(value)) {
				throw new Error(value + ' is not an array');
			}
			
			iterationHelper(ctx, value, value, null, tmpl, iterate);
		},

		'eachkey': function eachkeyHelper(ctx, value, tmpl, iterate) {
			var keys = Object.keys(value);
			var array = keys.map(function(key) {
					return { key: key, value: value[key] };
				});

			iterationHelper(ctx, array, keys, { object: value }, tmpl, iterate);
		},

		'dom': function domHelper(ctx, value, tmpl, iterate) {
			iterate(function() {
				if (value.ownerDocument !== ctx.doc) {
					value = ctx.doc.importNode(value, true);
				}

				return value;
			});
		},

		'define': function defineHelper(ctx, value, tmpl) {
			defined[value] = tmpl;
		},

		'use': function useHelper(ctx, value, tmpl, iterate) {
			if (!(value in defined)) {
				throw new Error('Template \'' + value + '\' has not been @defined');
			}

			iterate(function(key, rendered) {
				if (rendered) {
					rendered.update(ctx);
				} else {
					return defined[value].render(ctx);
				}
			});
		}
	};
	
	/* Directive manager object */
	directives = {
		register: function registerDirective(name, helper) {
			registered[name] = helper;
		},

		has: function hasDirective(name) {
			return name in registered && typeof registered[name] === 'function';
		},

		get: function getDirective(name) {
			return registered[name];
		}
	};
	
	return directives;
});
