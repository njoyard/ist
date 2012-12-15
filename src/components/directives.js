define(['components/livefragment'], function(LiveFragment) {
	var directives, registered, conditionalHelper, iterationHelper;
	
	conditionalHelper = function(render, tmpl, fragment) {
		if (render) {
			if (fragment.hasChildNodes) {
				// Fragment contains nodes, update them
				tmpl.update(this, fragment);
			} else {
				// Nothing in fragment, render subtemplate
				fragment.appendChild(tmpl.render(this));
			}
		} else {
			// Empty fragment
			fragment.empty();
		}
	};
	
	iterationHelper = function(keys, items, ctx, tmpl, fragment) {
		var outer = this.value,
			renderedFragments = [],
			lastFragment,
			lastKey,
			findRenderedFragment;
			
		/* Start by building a list of fragments to group already
		   rendered nodes by source array item (knowing that they are
		   adjacent siblings) */
		fragment.childNodes.forEach(function(node) {
			var key = ctx.istData(node).iterationKey;
			
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
				sctx = ctx.createContext(item),
				rendered = findRenderedFragment(item);
				
			sctx.pushScope({
				loop: {
					first: index == 0,
					index: index,
					last: index == items.length - 1,
					length: items.length,
					outer: outer
				}
			});
			
			if (rendered) {
				tmpl.update(sctx, rendered);
				fragment.appendChild(rendered);
			} else {
				rendered = tmpl.render(sctx);
				for (i = 0, len = rendered.childNodes.length; i < len; i++) {
					ctx.istData(rendered.childNodes[i]).iterationKey = keys[index];
				}
				fragment.appendChild(rendered);
			}
		});
	};
	
	
	/* Built-in directive helpers (except @include) */
	registered = {
		"if": function(ctx, tmpl, fragment) {
			conditionalHelper.call(this, ctx.value, tmpl, fragment);
		},

		"unless": function(ctx, tmpl, fragment) {
			conditionalHelper.call(this, !ctx.value, tmpl, fragment);
		},

		"with": function(ctx, tmpl, fragment) {
			if (fragment.childNodes.length) {
				tmpl.update(ctx, fragment);
			} else {
				fragment.appendChild(tmpl.render(ctx));
			}
		},

		"each": function(ctx, tmpl, fragment) {
			var array = ctx.value;
			
			if (!Array.isArray(array)) {
				throw new Error(array + " is not an array");
			}
			
			iterationHelper(array, array, ctx, tmpl, fragment);
		},

		"eachkey": function(ctx, tmpl) {
			var object = ctx.value,
				keys = Object.keys(object),
				array;
				
			array = keys.map(function(k) {
				return { key: k, value: object[k] };
			});
			
			// TODO 'object' must be added to 'loop' !
			iterationHelper(keys, array, ctx, tmpl, fragment);
		}
	};
	
	/* Directive manager object */
	directives = {
		register: function(name, helper) {
			registered[name] = helper;
		},

		get: function(name) {
			return registered[name]
		}
	};
	
	return directives;
});
