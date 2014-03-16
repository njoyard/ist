/*global define, requirejs, isAMD, isNode, isBrowser */
define([
	'components/template',
	'components/directives',
	'components/context',
	'parser/parser',
	'parser/preprocessor',
	'util/amdplugin',
	'util/misc'
], function(Template, directives, Context, pegjsParser, preprocess, pluginify, misc) {
	'use strict';

	/**
	 * Template parser
	 */
	function ist(template, name) {
		var parsed;

		name = name || '<unknown>';

		try {
			parsed = pegjsParser.parse(preprocess(template));
		} catch(e) {
			e.message += ' in \'' + name + '\' on line ' + e.line +
				(typeof e.column !== 'undefined' ?  ', character ' + e.column : '');
			throw e;
		}

		return new Template(name, parsed);
	}

	ist.Template = Template;

	/* Deprecated method names */
	ist.fromScriptTag = function(id) {
		if (console) (console.warn || console.log)('Warning: ist.fromScriptTag is deprecated, use ist.script instead');
		return ist.script(id);
	};
	ist.registerHelper = function(name, helper) {
		if (console) (console.warn || console.log)('Warning: ist.registerHelper is deprecated, use ist.helper instead');
		ist.helper(name, helper);
	};
	ist.createNode = function(branchSpec, context, doc) {
		if (console) (console.warn || console.log)('Warning: ist.createNode is deprecated, use ist.create instead');
		return ist.create(branchSpec, context, doc);
	};


	/**
	 * Node creation interface
	 * Creates nodes with IST template syntax
	 *
	 * Several nodes can be created at once using angle brackets, eg.:
	 *   ist.createNode('div.parent > div#child > 'text node')
	 *
	 * Supports context variables and an optional alternative document.
	 * Does not support angle brackets anywhere else than between nodes.
	 * 
	 * Directives are supported ('div.parent > @each ctxVar > div.child')
	 */
	ist.create = function(branchSpec, context, doc) {
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
	ist.script = function(id) {
		var template = misc.findScript(id);

		if (template) {
			return ist(template);
		}
	};


	/**
	 * IST helper block registration; allows custom iterators/helpers that will
	 * be called with a new context.
	 */
	ist.helper = function(name, helper) {
		directives.register(name, helper);
	};

	/* Built-in @include helper */
	ist.helper('include', function(ctx, value, tmpl, iterate) {
		iterate(function(key, rendered) {
			if (rendered) {
				rendered.update(ctx);
			} else {
				var name = value,
					what = name.replace(/\.ist$/, ''),
					found, tryReq;

				// Try to find a <script type='text/x-ist' id='...'>
				found = misc.findScript(name);

				if (isAMD) {
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
					throw new Error('Cannot find included template \'' + name + '\'');
				}

				if (typeof found === 'string') {
					// Compile template
					found = ist(found, what);
				}

				if (typeof found.render === 'function') {
					// Render included template
					return found.render(ctx);
				} else {
					throw new Error('Invalid included template \'' + name + '\'');
				}
			}
		});
	});


	/* Global scope registration */
	ist.global = function(key, value) {
		Context.globalScope[key] = value;
	};


	if (isNode || (isBrowser && isAMD)) {
		pluginify(ist);
	}

	return ist;
});
