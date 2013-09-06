/*global define */
define(['components/livefragment'], function(LiveFragment) {
	'use strict';

	var directives, registered, conditionalHelper, iterationHelper,
		defined = {};
	
	conditionalHelper = function(outer, render, tmpl, fragment) {
		if (render) {
			if (fragment.hasChildNodes) {
				// Fragment contains nodes, update them
				tmpl.render(outer, null, fragment);
			} else {
				// Nothing in fragment, render subtemplate
				fragment.appendChild(tmpl.render(outer));
			}
		} else {
			// Empty fragment
			fragment.empty();
		}
	};
	
	iterationHelper = function(outer, keys, items, inner, tmpl, fragment) {
		var outerValue = outer.value,
			renderedFragments = [],
			lastFragment,
			lastKey,
			findRenderedFragment;
			
		/* Start by building a list of fragments to group already
		   rendered nodes by source array item (knowing that they are
		   adjacent siblings) */
		fragment.childNodes.forEach(function(node) {
			var key = inner.istData(node).iterationKey;
			
			if (key !== lastKey) {
				if (keys.indexOf(key) === -1) {
					// Item has gone away, remove node immediately
					fragment.removeChild(node);
				} else {
					lastFragment = new LiveFragment(fragment, [node]);
					lastKey = key;
				
					renderedFragments.push({
						key: key,
						fragment: lastFragment
					});
				}
			} else {
				lastFragment.extend(node);
			}
		});
		
		findRenderedFragment = function(key) {
			var i, len;
			for (i = 0, len = renderedFragments.length; i < len; i++) {
				if (renderedFragments[i].key === key) {
					return renderedFragments[i].fragment;
				}
			}
		};
		
		/* Loop over array and append updated/newly rendered fragments */
		items.forEach(function(item, index) {
			var i, len,
				sctx = inner.createContext(item),
				rendered = findRenderedFragment(item);
				
			sctx.pushScope({
				loop: {
					first: index === 0,
					index: index,
					last: index == items.length - 1,
					length: items.length,
					outer: outerValue
				}
			});
			
			if (rendered) {
				tmpl.render(sctx, null, rendered);
			} else {
				rendered = tmpl.render(sctx, null, rendered);
				for (i = 0, len = rendered.childNodes.length; i < len; i++) {
					inner.istData(rendered.childNodes[i]).iterationKey = keys[index];
				}
			}
			
			fragment.appendChild(rendered);
		});
	};
	
	
	/* Built-in directive helpers (except @include) */
	registered = {
		'if': function(outer, inner, tmpl, fragment) {
			conditionalHelper.call(null, outer, inner.value, tmpl, fragment);
		},

		'unless': function(outer, inner, tmpl, fragment) {
			conditionalHelper.call(null, outer, !inner.value, tmpl, fragment);
		},

		'with': function(outer, inner, tmpl, fragment) {
			
		
			if (fragment.hasChildNodes()) {
				tmpl.render(inner, null, fragment);
			} else {
				fragment.appendChild(tmpl.render(inner));
			}
		},

		'each': function(outer, inner, tmpl, fragment) {
			var array = inner.value;
			
			if (!Array.isArray(array)) {
				throw new Error(array + ' is not an array');
			}
			
			iterationHelper.call(null, outer, array, array, inner, tmpl, fragment);
		},

		'eachkey': function(outer, inner, tmpl, fragment) {
			var object = inner.value,
				keys = Object.keys(object),
				array;
				
			array = keys.map(function(k) {
				return { key: k, value: object[k] };
			});
			
			// TODO 'object' must be added to 'loop' !
			iterationHelper.call(null, outer, keys, array, inner, tmpl, fragment);
		},

		'dom': function(outer, inner, tmpl, fragment) {
			var node = inner.value;

			while (fragment.hasChildNodes()) {
				fragment.removeChild(fragment.firstChild);
			}

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

			while (fragment.hasChildNodes()) {
				fragment.removeChild(fragment.firstChild);
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
