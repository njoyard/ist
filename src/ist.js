define([
	'components/template',
	'parser/parser',
	'parser/preprocessor',
	'util/amdplugin',
	'util/findscript'
], function(Template, pegjsParser, preprocess, pluginify, findScriptTag) {
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
	
	
	directives = (function(ist) {
		/* Built-in directive helpers */
		var registered = {
			"if": function(ctx, tmpl) {
				if (ctx.value) {
					return tmpl.render(this);
				}
			},
	
			"unless": function(ctx, tmpl) {
				if (!ctx.value) {
					return tmpl.render(this);
				}
			},
	
			"with": function(ctx, tmpl) {
				return tmpl.render(ctx);
			},
	
			"each": function(ctx, tmpl) {
				var fragment = this.createDocumentFragment(),
					outer = this.value,
					value = ctx.value;
	
				if (value && Array.isArray(value)) {
					value.forEach(function(item, index) {
						var sctx = ctx.createContext(item);
			
						sctx.pushScope({
							loop: {
								first: index == 0,
								index: index,
								last: index == value.length - 1,
								length: value.length,
								outer: outer
							}
						});
						fragment.appendChild(tmpl.render(sctx));
						sctx.popScope();
					});
				}
	
				return fragment;
			},
	
			"eachkey": function(ctx, tmpl) {
				var fragment = this.createDocumentFragment(),
					outer = this.value,
					value = ctx.value,
					keys;
	
				if (value) {
					keys = Object.keys(value);
					keys.forEach(function(key, index) {
						var sctx = ctx.createContext({
							key: key,
							value: value[key],
							loop: {
								first: index == 0,
								index: index,
								last: index == keys.length - 1,
								length: keys.length,
								object: value,
								outer: outer
							}
						});
				
						fragment.appendChild(tmpl.render(sctx));
					});
				}
	
				return fragment;
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
