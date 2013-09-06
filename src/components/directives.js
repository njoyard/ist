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
		if (render) {
			fragment.appendChild(tmpl.render(outer));
		}
	}
	
	/**
	 * Iteration helper for @each, @eachkey
	 *
	 * @param {Context} outer outer context
	 * @param {Array} items item array to iterate over
	 * @param [loopAdd] additional loop properties
	 * @param {Template} tmpl template to render for each item
	 * @param {DocumentFragment} fragment target fragment
	 */
	function iterationHelper(outer, items, loopAdd, tmpl, fragment) {
		var outerValue = outer.value;
		
		/* Loop over array and append rendered fragments */
		items.forEach(function(item, index) {
			var sctx = outer.createContext(item),
				loop = {
					first: index === 0,
					index: index,
					last: index == items.length - 1,
					length: items.length,
					outer: outerValue
				};

			if (loopAdd) {
				Object.keys(loopAdd).forEach(function(key) {
					loop[key] = loopAdd[key];
				})
			}

			sctx.pushScope({ loop: loop });
			fragment.appendChild(tmpl.render(sctx));
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
			fragment.appendChild(tmpl.render(inner));
		},

		'each': function(outer, inner, tmpl, fragment) {
			var array = inner.value;
			
			if (!Array.isArray(array)) {
				throw new Error(array + ' is not an array');
			}
			
			iterationHelper(outer, array, null, tmpl, fragment);
		},

		'eachkey': function(outer, inner, tmpl, fragment) {
			var object = inner.value,
				array;
				
			array = Object.keys(object).map(function(k) {
				return { key: k, value: object[k] };
			});
			
			iterationHelper(outer, array, { object: object }, tmpl, fragment);
		},

		'dom': function(outer, inner, tmpl, fragment) {
			var node = inner.value;

			if (node.ownerDocument !== inner.doc) {
				node = inner.doc.importNode(node);
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

			fragment.appendChild(template.render(outer));
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
