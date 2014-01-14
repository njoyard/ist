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
	 * @param {DocumentFragment} fragment target fragment
	 */
	function conditionalHelper(ctx, render, tmpl, fragment) {
		var rendered = fragment.extractRenderedFragment();

		if (render) {
			if (rendered) {
				rendered.update(ctx);
			} else {
				rendered = tmpl.render(ctx);
			}

			fragment.appendRenderedFragment(rendered);
		}
	}

	
	/**
	 * Iteration helper for @each, @eachkey
	 *
	 * @param {Context} ctx rendering context
	 * @param {Array} items item array to iterate over
	 * @param {Array} keys item identifiers
	 * @param [loopAdd] additional loop properties
	 * @param {Template} tmpl template to render for each item
	 * @param {DocumentFragment} fragment target fragment
	 */
	function iterationHelper(ctx, items, keys, loopAdd, tmpl, fragment) {
		var outerValue = ctx.value;

		/* Extract previously rendered fragments */
		var extracted = fragment.extractRenderedFragments(),
			fragKeys = extracted.keys,
			fragments = extracted.fragments;
		
		/* Loop over array and append rendered fragments */
		items.forEach(function itemIterator(item, index) {
			ctx.pushValue(item);

			/* Create subcontext */
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

			/* Render or update fragments */
			var keyIndex = fragKeys.indexOf(keys[index]),
				rendered;

			if (keyIndex === -1) {
				/* Item was not rendered yet */
				rendered = tmpl.render(ctx);
			} else {
				rendered = fragments[keyIndex];
				rendered.update(ctx);
			}

			ctx.popScope();
			ctx.popValue();

			fragment.appendRenderedFragment(rendered, keys[index]);
		});
	}
	
	
	/* Built-in directive helpers (except @include) */
	registered = {
		'if': function ifHelper(ctx, value, tmpl, fragment) {
			conditionalHelper.call(null, ctx, value, tmpl, fragment);
		},

		'unless': function unlessHelper(ctx, value, tmpl, fragment) {
			conditionalHelper.call(null, ctx, !value, tmpl, fragment);
		},

		'with': function withHelper(ctx, value, tmpl, fragment) {
			var rendered = fragment.extractRenderedFragment();

			ctx.pushValue(value);

			if (rendered) {
				rendered.update(ctx);
			} else {
				rendered = tmpl.render(ctx);
			}

			ctx.popValue();

			fragment.appendChild(tmpl.render(value));
		},

		'each': function eachHelper(ctx, value, tmpl, fragment) {
			if (!Array.isArray(value)) {
				throw new Error(value + ' is not an array');
			}
			
			iterationHelper(ctx, value, value, null, tmpl, fragment);
		},

		'eachkey': (function() {
			function extractItem(k) {
				return { key: k, value: this[k] };
			}

			return function eachkeyHelper(ctx, value, tmpl, fragment) {
				var keys = Object.keys(value),
					array;
					
				array = keys.map(extractItem, value);
				iterationHelper(ctx, array, keys, { object: value }, tmpl, fragment);
			};
		}()),

		'dom': function domHelper(ctx, value, tmpl, fragment) {
			if (value.ownerDocument !== ctx.doc) {
				value = ctx.doc.importNode(value, true);
			}

			while(fragment.hasChildNodes()) {
				fragment.removeChild(fragment.firstChild);
			}
			fragment.appendChild(value);
		},

		'define': function defineHelper(ctx, value, tmpl, fragment) {
			defined[value] = tmpl;
		},

		'use': function useHelper(ctx, value, tmpl, fragment) {
			var template = defined[value];

			if (!template) {
				throw new Error('Template \'' + value + '\' has not been @defined');
			}

			var rendered = fragment.extractRenderedFragment();

			if (rendered) {
				rendered.update(ctx);
			} else {
				rendered = template.render(ctx);
			}

			fragment.appendRenderedFragment(rendered);
		}
	};
	
	/* Directive manager object */
	directives = {
		register: function registerDirective(name, helper) {
			registered[name] = helper;
		},

		get: function getDirective(name) {
			return registered[name];
		}
	};
	
	return directives;
});
