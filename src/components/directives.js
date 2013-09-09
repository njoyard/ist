/*global define */
define(function() {
	'use strict';

	var directives, registered,
		defined = {};
	
	/**
	 * Conditional helper for @if, @unless
	 *
	 * @param {Context} outer outer context
	 * @param render render template if truthy
	 * @param {Template} tmpl template to render
	 * @param {DocumentFragment} fragment target fragment
	 */
	function conditionalHelper(outer, render, tmpl, fragment) {
		var rendered = fragment.extractRenderedFragment();

		if (render) {
			if (rendered) {
				rendered.update(outer);
			} else {
				rendered = tmpl.render(outer);
			}

			fragment.appendRenderedFragment(rendered);
		}
	}
	
	/**
	 * Iteration helper for @each, @eachkey
	 *
	 * @param {Context} outer outer context
	 * @param {Array} items item array to iterate over
	 * @param {Array} keys item identifiers
	 * @param [loopAdd] additional loop properties
	 * @param {Template} tmpl template to render for each item
	 * @param {DocumentFragment} fragment target fragment
	 */
	function iterationHelper(outer, items, keys, loopAdd, tmpl, fragment) {
		var outerValue = outer.value,
			fragKeys, fragments;

		/* Extract previously rendered fragments */
		fragKeys = fragment.getRenderedFragmentKeys();
		fragments = fragKeys.map(function(key) {
			return fragment.extractRenderedFragment(key);
		});
		
		/* Loop over array and append rendered fragments */
		items.forEach(function(item, index) {
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

			var sctx = outer.createContext(item);
			sctx.pushScope({ loop: loop });

			/* Render or update fragments */
			var keyIndex = fragKeys.indexOf(keys[index]),
				rendered;

			if (keyIndex === -1) {
				/* Item was not rendered yet */
				rendered = tmpl.render(sctx);
			} else {
				rendered = fragments[keyIndex];
				rendered.update(sctx);
			}

			fragment.appendRenderedFragment(rendered, keys[index]);
		});
	}
	
	
	/* Built-in directive helpers (except @include) */
	registered = {
		'if': function(outer, inner, tmpl, fragment) {
			conditionalHelper.call(null, outer, inner.value, tmpl, fragment);
		},

		'unless': function(outer, inner, tmpl, fragment) {
			conditionalHelper.call(null, outer, !inner.value, tmpl, fragment);
		},

		'with': function(outer, inner, tmpl, fragment) {
			var rendered = fragment.extractRenderedFragment();

			if (rendered) {
				rendered.update(inner);
			} else {
				rendered = tmpl.render(inner);
			}

			fragment.appendChild(tmpl.render(inner));
		},

		'each': function(outer, inner, tmpl, fragment) {
			var array = inner.value;
			
			if (!Array.isArray(array)) {
				throw new Error(array + ' is not an array');
			}
			
			iterationHelper(outer, array, array, null, tmpl, fragment);
		},

		'eachkey': function(outer, inner, tmpl, fragment) {
			var object = inner.value,
				keys = Object.keys(object),
				array;
				
			array = keys.map(function(k) {
				return { key: k, value: object[k] };
			});
			
			iterationHelper(outer, array, keys, { object: object }, tmpl, fragment);
		},

		'dom': function(outer, inner, tmpl, fragment) {
			var node = inner.value;

			if (node.ownerDocument !== inner.doc) {
				node = inner.doc.importNode(node);
			}

			while(fragment.hasChildNodes()) {
				fragment.removeChild(fragment.firstChild);
			}
			fragment.appendChild(node);
		},

		'define': function(outer, inner, tmpl, fragment) {
			defined[inner.value] = tmpl;
		},

		'use': function(outer, inner, tmpl, fragment) {
			var name = inner.value,
				template = defined[name];

			if (!template) {
				throw new Error('Template \'' + name + '\' has not been @defined');
			}

			var rendered = fragment.extractRenderedFragment();

			if (rendered) {
				rendered.update(outer);
			} else {
				rendered = template.render(outer);
			}

			fragment.appendRenderedFragment(rendered);
		}
	};
	
	/* Directive manager object */
	directives = {
		register: function(name, helper) {
			registered[name] = helper;
		},

		get: function(name) {
			return registered[name];
		}
	};
	
	return directives;
});
