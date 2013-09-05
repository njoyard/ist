/*global define, requirejs, isAMD */
define([
	'components/template',
	'components/directives',
	'parser/parser',
	'parser/preprocessor',
	'util/amdplugin',
	'util/findscript'
], function(Template, directives, pegjsParser, preprocess, pluginify, findScriptTag) {
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
	
	
	/* Built-in @include helper */
	ist.registerHelper('include', function(outer, inner, tmpl, fragment) {
		var what = inner.value.replace(/\.ist$/, ''),
			found, tryReq;

		// Try to find a <script type="text/x-ist" id="...">
		found = findScriptTag(what);

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
			throw new Error('Cannot find included template \'' + what + '\'');
		}

		if (typeof found === 'string') {
			// Compile template
			found = ist(found, what);
		}

		if (typeof found.render === 'function') {
			// Render included template
			if (fragment.hasChildNodes) {
				found.update(outer, fragment);
			} else {
				fragment.appendChild(found.render(outer));
			}
		} else {
			throw new Error('Invalid included template \'' + what + '\'');
		}
	});
	

	if (isAMD) {
		pluginify(ist);
	}
	
	return ist;
});
