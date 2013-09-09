/*global define */
define([
	'components/context',
	'components/renderer'
],
function(Context, Renderer) {
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

		this.nodes.forEach(preRenderRec);
	}
	
	
	/* Prerender recursion helper */
	function preRenderRec(node) {
		var pr;
		
		/* Constant text node */
		if (typeof node.text !== 'undefined' &&
				!expressionRE.test(node.text)) {
			node.pr = document.createTextNode(node.text);
		}
		
		/* Element node */
		if (typeof node.tagName !== 'undefined') {
			node.pr = pr = document.createElement(node.tagName);
			
			node.classes.forEach(function(cls) {
				pr.classList.add(cls);
			});

			if (typeof node.id !== 'undefined') {
				pr.id = node.id;
			}
		}
	
		if (typeof node.children !== 'undefined') {
			node.children.forEach(preRenderRec);
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
		if (console) console.log("Warning: Template#findPartial is deprecated, use Template#partial instead");
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
		if (!(context instanceof Context)) {
			context = new Context(context, doc);
		}

		var template = this,
			rendered = (new Renderer(template, context)).render();

		/* Add an update method */
		rendered.update = function(ctx) {
			/* Update context if present */
			if (ctx instanceof Context) {
				context = ctx;
			} else if (ctx) {
				context = new Context(ctx, doc);
			}

			/* Get previously rendered nodes parent and previous sibling */
			var children = this.update.nodes,
				child0 = children[0],
				parent = child0.parentNode,
				previous = child0.previousSibling;

			/* Put previously rendered nodes in a fragment */
			var fragment = context.createDocumentFragment();
			children.forEach(function(child) {
				fragment.appendChild(child);
			});

			(new Renderer(template, context)).render(fragment);

			/* Put nodes back where they were */
			this.update.nodes = [].slice.call(fragment.childNodes);

			if (previous) {
				parent.insertBefore(fragment, previous.nextSibling);
			} else {
				parent.appendChild(fragment);
			}
		};

		/* Keep a ref to child nodes */
		rendered.update.nodes = [].slice.call(rendered.childNodes);

		return rendered;
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
