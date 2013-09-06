/*global define */
define([
	'components/context',
	'components/directives'
],
function(Context, directives) {
	'use strict';

	var expressionRE = /{{((?:}(?!})|[^}])*)}}/,
		slice = Array.prototype.slice;
		
	
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
		
		this.prerendered = false;
		this._preRender();
	}
	
	
	/* Prerender recursion helper */
	function preRenderRec(node) {
		var pr, doc = this;
		
		/* Constant text node */
		if (typeof node.text !== 'undefined' &&
				!expressionRE.test(node.text)) {
			node.pr = doc.createTextNode(node.text);
		}
		
		/* Element node */
		if (typeof node.tagName !== 'undefined') {
			node.pr = pr = doc.createElement(node.tagName);
			
			node.classes.forEach(function(cls) {
				pr.classList.add(cls);
			});

			if (typeof node.id !== 'undefined') {
				pr.id = node.id;
			}
		}
	
		if (typeof node.children !== 'undefined') {
			node.children.forEach(preRenderRec, doc);
		}
	}
	
	
	/* Prerender constant part of nodes */
	Template.prototype._preRender = function(doc) {
		/* Ensure we have a document, or postpone prerender */
		doc = doc || document;
		if (!doc) {
			return;
		}

		this.nodes.forEach(preRenderRec, doc);
		this.prerendered = true;
	};
	
	
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
	
	
	/* Text node rendering helper */
	Template.prototype._renderTextNode = function(ctx, node) {
		var tnode;
		
		if (typeof node.pr !== 'undefined') {
			tnode = ctx.importNode(node.pr, false);
		} else {
			try {
				tnode = ctx.createTextNode(ctx.interpolate(node.text));
			} catch (err) {
				throw this._completeError(err, node);
			}
		}
		
		return tnode;
	};
	
	
	/* Element rendering helper */
	Template.prototype._renderElement = function(ctx, node) {
		var elem;
		
		if (typeof node.pr !== 'undefined') {
			elem = ctx.importNode(node.pr, false);
		} else {
			elem = ctx.createElement(node.tagName);

			node.classes.forEach(function(cls) {
				elem.classList.add(cls);
			});

			if (typeof node.id !== 'undefined') {
				elem.id = node.id;
			}
		}

		// Set attributes
		Object.keys(node.attributes).forEach(function(attr) {
			var value;

			try {
				value = ctx.interpolate(node.attributes[attr]);
			} catch (err) {
				throw this._completeError(err, node);
			}
		
			elem.setAttribute(attr, value);
		}, this);
	
		// Set properties
		Object.keys(node.properties).forEach(function(prop) {
			var value;

			try {
				value = ctx.interpolate(node.properties[prop]);
			} catch (err) {
				throw this._completeError(err, node);
			}
		
			elem[prop] = value;
		}, this);
		
		// Set event handlers
		Object.keys(node.events).forEach(function(event) {
			node.events[event].forEach(function(expr) {
				var handler;

				try {
					handler = ctx.evaluate(expr);
				} catch(err) {
					throw this._completeError(err, node);
				}
			
				elem.addEventListener(event, handler, false);
			}, this);
		}, this);
		
		return elem;
	};
	
	
	/* Directive rendering helpers */
	Template.prototype._renderDirective = function(ctx, node) {
		var subTemplate = new Template(this.name, node.children),
			helper = directives.get(node.directive),
			fragment = ctx.createDocumentFragment(),
			subCtx;
	
		if (typeof helper !== 'function') {
			throw new Error('No directive helper for @' + node.directive + ' has been registered');
		}
	
		if (typeof node.expr !== 'undefined') {
			try {
				subCtx = ctx.createContext(ctx.evaluate(node.expr));
			} catch(err) {
				throw this._completeError(err, node);
			}
		}
	
		try {
			helper.call(null, ctx, subCtx, subTemplate, fragment);
		} catch (err) {
			throw this._completeError(err, node);
		}

		return fragment;
	};
	
	
	/* Look for a node with the given partial name and return a new
	   Template object if found */
	Template.prototype.findPartial = function(name) {
		var result;
		
		if (typeof name === 'undefined') {
			return;
		}
			
		result = findPartialRec(name, this.nodes);
		
		if (typeof result !== 'undefined') {
			return new Template(this.name, [result]);
		}
	};
	
	function renderRec(node, index) {
		var template = this.template,
			ctx = this.context,
			tnode;
	
		if (typeof node.text !== 'undefined') {
			tnode = template._renderTextNode(ctx, node);
		}
				
		if (typeof node.tagName !== 'undefined') {
			tnode = template._renderElement(ctx, node);

			node.children.map(
				renderRec,
				{
					template: template,
					context: ctx
				}
			).forEach(function(cnode) {
				tnode.appendChild(cnode);
			});
		}
		
		if (typeof node.directive !== 'undefined') {
			tnode = template._renderDirective(ctx, node);
		}

		return tnode;
	}

	
	/* Render template using 'context' in 'doc' */
	Template.prototype.render = function(context, doc) {
		if (!(context instanceof Context)) {
			context = new Context(context, doc);
		} else {
			doc = context.doc;
		}
		
		if (!this.prerendered) {
			this._preRender(context.document);
		}
			
		var fragment = context.createDocumentFragment();
	
		this.nodes.map(
			renderRec,
			{
				template: this,
				context: context
			}
		).forEach(function(node) {
			fragment.appendChild(node);
		});
	
		return fragment;
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
