define([
	'components/context',
	'components/livefragment',
	'components/rendered',
	'components/directives'
],
function(Context, LiveFragment, RenderedTemplate, directives) {
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
	
	
	/* Extract a LiveFragment from parent where nodes have "index" value */
	function findIndex(context, parent, index) {
		var nodes = parent.childNodes,
			result = [],
			previous = null,
			next = null,
			i, len, node, idx;
		
		for (i = 0, len = nodes.length; i < len; i++) {
			node = nodes[i];
			idx = context.istData(node).index;
			
			if (idx < index) {
				previous = node;
			}
			
			if (idx === index) {
				result.push(nodes[i]);
			}
			
			if (idx > index) {
				next = node;
				break;
			}
		}

		return new LiveFragment(parent, result, previous, next);
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
	Template.prototype._renderTextNode = function(ctx, node, index, fragment) {
		var tnode;
		
		if (!fragment.firstChild) {
			if (typeof node.pr !== 'undefined') {
				tnode = ctx.importNode(node.pr, false);
			} else {
				try {
					tnode = ctx.createTextNode(ctx.interpolate(node.text));
				} catch (err) {
					throw this._completeError(err, node);
				}
			}
			
			ctx.istData(tnode).index = index;
			fragment.appendChild(tnode);
		} else {
			fragment.firstChild.data = ctx.interpolate(node.text);
		}
	};
	
	
	/* Element rendering helper */
	Template.prototype._renderElement = function(ctx, node, index, fragment) {
		var elem = fragment.firstChild,
			needsInserting = false,
			data;
		
		if (!elem) {
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
			
			needsInserting = true;
		}
		
		data = ctx.istData(elem);
		
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
		
		// Remove previously set handlers
		if (data.detach) {
			data.detach.forEach(function(detach) {
				elem.removeEventListener(detach.event, detach.handler, false);
			});
		}
		data.detach = [];
		
		// Set new handlers
		Object.keys(node.events).forEach(function(event) {
			node.events[event].forEach(function(expr) {
				var handler;

				try {
					handler = ctx.evaluate(expr);
				} catch(err) {
					throw this._completeError(err, node);
				}
			
				data.detach.push({ event: event, handler: handler });
				elem.addEventListener(event, handler, false);
			}, this);
		}, this);
		
		data.index = index;
		
		if (needsInserting) {
			fragment.appendChild(elem);
		}
	};
	
	
	/* Directive rendering helpers */
	Template.prototype._renderDirective = function(ctx, node, index, fragment) {
		var subTemplate = new Template(this.name, node.children),
			helper = directives.get(node.directive),
			subCtx, i, len;
	
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
		
		for (i = 0, len = fragment.childNodes.length; i < len; i++) {
			ctx.istData(fragment.childNodes[i]).index = index;
		}
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
			fragment = findIndex(ctx, this.fragment, index);
	
		if (typeof node.text !== 'undefined') {
			template._renderTextNode(ctx, node, index, fragment);
		}
				
		if (typeof node.tagName !== 'undefined') {
			template._renderElement(ctx, node, index, fragment);
			node.children.forEach(
				renderRec,
				{
					template: template,
					context: ctx,
					fragment: fragment.firstChild
				}
			);
		}
		
		if (typeof node.directive !== 'undefined') {
			template._renderDirective(ctx, node, index, fragment);
		}
	}

	
	/* Render template using 'context' in 'doc' */
	Template.prototype.render = function(context, doc, fragment) {
		var detached;
		
		if (!(context instanceof Context)) {
			context = new Context(context, doc);
		} else {
			doc = context.doc;
		}
		
		if (!this.prerendered) {
			this._preRender(context.document);
		}
			
		if (!fragment) {
			fragment = context.createDocumentFragment();
		}

		if (fragment instanceof LiveFragment) {
			// Detach nodes from document while updating
			detached = fragment;
			fragment = detached.getDocumentFragment();
		}
	
		this.nodes.forEach(
			renderRec,
			{
				template: this,
				context: context,
				fragment: fragment
			}
		);

		if (detached) {
			// Reattach nodes
			detached.appendChild(fragment);
			fragment = detached;
		}
	
		return fragment;
	};
	
	
	Template.prototype.renderInto = function(destination, context) {
		var fragment, rendered;
		
		if (!(context instanceof Context)) {
			context = new Context(context, destination.ownerDocument);
		}
		
		fragment = this.render(context, destination.ownerDocument);
		
		if (fragment.hasChildNodes()) {
			rendered = new RenderedTemplate(this, context, slice.call(fragment.childNodes));
		} else {
			// No nodes rendered, give destination to RenderedTemplate
			rendered = new RenderedTemplate(this, context, null, destination);
		}
		
		destination.appendChild(fragment);
		return rendered;
	};
	
	
	Template.prototype.update = function(context, nodes) {
		var doc, isFragment, fragment;
		
		isFragment = nodes.nodeType &&
			nodes.nodeType === nodes.DOCUMENT_FRAGMENT_NODE;
		
		if (!nodes || (!isFragment && !nodes.length)) {
			throw new Error('No nodes to update');
		}
		
		if (!(context instanceof Context)) {
			doc = isFragment ? nodes.ownerDocument : nodes[0].ownerDocument;
			context = new Context(context, doc);
		} else {
			doc = context.doc;
		}
		
		fragment = isFragment ? nodes :
			new LiveFragment(nodes[0].parentNode, slice.call(nodes));
		
		return this.render(context, null, fragment);
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
