define([
	'components/template',
	'components/livefragment',
	'parser/parser',
	'parser/preprocessor',
	'util/amdplugin',
	'util/findscript'
], function(Template, LiveFragment, pegjsParser, preprocess, pluginify, findScriptTag) {
	var directives, ist;
	
	/**
	 * Template parser
	 */
	ist = function(template, name) {
		var parsed;
		
		name = name || '<unknown>';
		
		try {
			parsed = pegjsParser.parse(preprocess(template));
		} catch(e) {
			e.message += " in '" + name + "' on line " + e.line +
				(typeof e.column !== 'undefined' ?  ", character " + e.column : '');
			throw e;
		}
	
		return new Template(name, parsed);
	};
	
	ist.Template = Template;
	
	/**
	 * Node creation interface
	 * Creates nodes with IST template syntax
	 *
	 * Several nodes can be created at once using angle brackets, eg.:
	 *   ist.createNode('div.parent > div#child > "text node")
	 *
	 * Supports context variables and an optional alternative document.
	 * Does not support angle brackets anywhere else than between nodes.
	 * 
	 * Directives are supported ("div.parent > @each ctxVar > div.child")
	 */
	ist.createNode = function(branchSpec, context, doc) {
		var nodes = branchSpec.split('>').map(function(n) { return n.trim(); }),
			indent = '',
			template = '',
			rendered;
	
		nodes.forEach(function(nodeSpec) {
			template += '\n' + indent + nodeSpec;
			indent += ' ';
		});
	
		rendered = ist(template).render(context, doc);
		return rendered.childNodes.length === 1 ? rendered.firstChild : rendered;
	};

	/**
	 * <script> tag template parser
	 */
	ist.fromScriptTag = function(id) {
		var template = findScriptTag(id);
		
		if (template) {
			return ist(template);
		}
	};


	/**
	 * IST helper block registration; allows custom iterators/helpers that will
	 * be called with a new context.
	 */
	ist.registerHelper = function(name, helper) {
		directives.register(name, helper);
	};
	
	
	conditionalHelper = function(render, tmpl, fragment) {
		if (render) {
			if (fragment.childNodes.length) {
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
					last: index == array.length - 1,
					length: array.length,
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
	
	
	directives = (function(ist) {
		/* Built-in directive helpers */
		var registered = {
			"if": function(ctx, tmpl, fragment) {
				conditionalHelper.call(this, ctx.value, tmpl, fragment);
			},
	
			"unless": function(ctx, tmpl) {
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
			},
	
			"include": function(ctx, tmpl) {
				var what = ctx.value.replace(/\.ist$/, ''),
					scripts, found, tryReq;
		
				// Try to find a <script type="text/x-ist" id="...">
				found = findScriptTag(what);
		
				if (isAMD)
				{
					// Try to find a previously require()-d template or string
					tryReq = [
						what,
						what + '.ist',
						'ist!' + what,
						'text!' + what + '.ist'
					];
	
					while (!found && tryReq.length) {
						try {
							found = requirejs(tryReq.shift());
						} catch(e) {
							// Pass
						}
					}
				}
		
				if (!found) {
					throw new Error("Cannot find included template '" + what + "'");
				}
	
				if (typeof found === 'string') {
					// Compile template
					found = ist(found, what);
				}
	
				if (typeof found.render === 'function') {
					// Render included template
					return found.render(this, tmpl.document);
				} else {
					throw new Error("Invalid included template '" + what + "'");
				}
			}
		};

		return {
			register: function(name, helper) {
				registered[name] = helper;
			},
	
			get: function(name) {
				return registered[name]
			}
		};
	}(ist));
	
	
	/* Give directives to Template to avoid circular module dependency */
	Template.setDirectives(directives);

	if (isAMD) {
		pluginify(ist);
	}
	
	return ist;
});
