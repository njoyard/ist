/*global define, console */
define([
	'components/codegen',
	'components/context',
	'components/renderer'
],
function(codegen, Context, Renderer) {
	'use strict';

	var expressionRE = /{{((?:}(?!})|[^}])*)}}/;
		
	
	function findPartialRec(name, nodes) {
		var found, i, len,
			results = nodes.filter(function(n) {
				return n.partial === name;
			});
			
		if (results.length) {
			return results[0];
		}
		
		for (i = 0, len = nodes.length; i < len; i++) {
			if (typeof nodes[i].children !== 'undefined') {
				found = findPartialRec(name, nodes[i].children);
				
				if (found) {
					return found;
				}
			}
		}
	}
	

	/**
	 * Template object; encapsulate template nodes and rendering helpers
	 */
	function Template(name, nodes) {
		this.name = name || '<unknown>';
		this.nodes = nodes;

		this.nodes.forEach(this._preRenderRec, this);
	}
	
	
	/* Prerender recursion helper */
	Template.prototype._preRenderRec = function(node) {
		var pr;

		if ('pr' in node || 'updater' in node) {
			return;
		}
	
		/* Prerender children */
		if ('children' in node) {
			node.children.forEach(this._preRenderRec, this);
		}

		/* Text node */
		if ('text' in node) {
			if (!expressionRE.test(node.text)) {
				/* Node content is constant */
				node.pr = document.createTextNode(node.text);
			} else {
				try {
					node.updater = codegen.textUpdater(node);
				} catch(err) {
					throw this._completeError(err, node);
				}
			}
		}
		
		/* Element node */
		if ('tagName' in node) {
			node.pr = pr = document.createElement(node.tagName);
			
			node.classes.forEach(function(cls) {
				pr.classList.add(cls);
			});

			if (typeof node.id !== 'undefined') {
				pr.id = node.id;
			}

			try {
				node.updater = codegen.elementUpdater(node);
			} catch(err) {
				throw this._completeError(err, node);
			}
		}

		/* Directive node */
		if ('directive' in node) {
			try {
				node.pr = {
					template: new Template(this.name, node.children),
					evaluator: codegen.directiveEvaluator(node)
				};
			} catch(err) {
				throw this._completeError(err, node);
			}
		}
	}
	
	
	/* Complete an Error object with information about the current node and
		template */
	Template.prototype._completeError = function(err, node) {
		var current = 'in \'' + this.name + '\' on line ' +
					  (node.line || '<unknown>');
		
		if (typeof err.istStack === 'undefined') {
			err.message += ' ' + current;
			err.istStack = [];
		}
		
		err.istStack.push(current);
		return err;
	};
	
	
	
	
	/* Look for a node with the given partial name and return a new
	   Template object if found */
	Template.prototype.findPartial = function(name) {
		if (console) (console.warn || console.log)("Warning: Template#findPartial is deprecated, use Template#partial instead");
		return this.partial(name);
	}
	Template.prototype.partial = function(name) {
		var result;
		
		if (typeof name === 'undefined') {
			return;
		}
			
		result = findPartialRec(name, this.nodes);
		
		if (typeof result !== 'undefined') {
			return new Template(this.name, [result]);
		}
	};
	

	
	/* Render template using 'context' in 'doc' */
	Template.prototype.render = function(context, doc) {
		var template = this,
			renderer = new Renderer(template);

		renderer.setContext(context, doc);
		return renderer.render();
	};


	/* Return code to regenerate this template */
	Template.prototype.getCode = function(pretty) {
		return 'new ist.Template(' +
			JSON.stringify(this.name) + ', ' +
			JSON.stringify(this.nodes, null, pretty ? 1 : 0) +
		');';
	};
	
	
	return Template;
});
