/*global define */
define(['components/directives'], function(directives) {
	'use strict';


	function Renderer(template, context) {
		this.template = template;
		this.context = context;
	}


	/* Error completion helper */
	Renderer.prototype._completeError = function(err, node) {
		return this.template._completeError(err, node);
	};


	/* Text node rendering helper */
	Renderer.prototype._renderTextNode = function(node, fragment) {
		var ctx = this.context,
			tnode = fragment.firstChild,
			insert = !tnode;

		if ('pr' in node) {
			/* Node is prerendered, so text content is constant */
			if (!tnode) {
				tnode = ctx.importNode(node.pr, false);
			}
		} else {
			if (!tnode) {
				tnode = ctx.createTextNode('');
			}

			try {
				tnode.textContent = ctx.interpolate(node.text);
			} catch (err) {
				throw this._completeError(err, node);
			}
		}

		if (insert) {
			fragment.appendChild(tnode);
		}
	};
	
	
	/* Element rendering helper */
	Renderer.prototype._renderElement = function(node, fragment) {
		var ctx = this.context,
			elem = fragment.firstChild,
			insert = !elem;

		if (!elem) {
			elem = ctx.importNode(node.pr, false);
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
		
		if (insert) {
			fragment.appendChild(elem);
		}
	};
	
	
	/* Directive rendering helpers */
	Renderer.prototype._renderDirective = function(node, fragment) {
		var ctx = this.context,
			tmpl = this.template,
			Template = tmpl.constructor,
			subTemplate = new Template(tmpl.name, node.children),
			helper = directives.get(node.directive),
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
	};


	Renderer.prototype._renderRec = function(node, fragment) {
		if (typeof node.text !== 'undefined') {
			this._renderTextNode(node, fragment);
		}
				
		if (typeof node.tagName !== 'undefined') {
			this._renderElement(node, fragment);
			fragment.firstChild.appendChild(this._renderNodes(node.children));
		}
		
		if (typeof node.directive !== 'undefined') {
			this._renderDirective(node, this._extendFragment(fragment));
		}
	};


	Renderer.prototype._extendFragment = function(fragment) {
		var renderer = this;

		fragment.appendRenderedFragment = function(sub, key) {
			sub.firstChild._istUpdate = sub.update;

			if (!('_istParent' in sub)) {
				sub._istParent = fragment;
			}

			renderer._pushNodes(sub, key);
		};

		fragment.extractRenderedFragment = function(key) {
			var pulled = renderer._pullNodes(fragment, key);

			if (pulled.firstChild && '_istRendered' in pulled.firstChild) {
				pulled.update = pulled.firstChild._istUpdate;
				delete pulled.firstChild._istUpdate;

				return pulled;
			}
		};

		return fragment;
	};


	/** 
	 * Pull nodes marked with `key` from parent into a new fragment
	 */
	Renderer.prototype._pullNodes = function(parent, key) {
		var children = [].slice.call(parent.childNodes),
			pulled = this.context.createDocumentFragment();

		pulled._istParent = parent;

		for (var i = 0, len = children.length; i < len; i++) {
			var child = children[i];

			if (child._istStack[0] === key) {
				if (!('_istPrevious' in pulled)) {
					pulled._istPrevious = child.previousSibling;
				}

				child._istStack.shift();
				pulled.appendChild(child);
			}
		}

		return pulled;
	};


	/**
	 * Push back nodes where they were pulled from, marking them with `key`
	 */
	Renderer.prototype._pushNodes = function(pulled, key) {
		var parent = pulled._istParent,
			next = '_istPrevious' in pulled ? pulled._istPrevious.nextSibling : null;

		[].slice.call(pulled.childNodes).forEach(function(child) {
			if (!child._istStack) {
				child._istStack = [];
			}

			child._istStack.unshift(key);
			parent.insertBefore(child, next);
		});
	};


	/**
	 * Render node array into fragment
	 */
	Renderer.prototype._renderNodes = function(nodes, fragment) {
		var renderer = this;

		fragment = fragment || this.context.createDocumentFragment();

		nodes.forEach(function(node) {
			var pulled = renderer._pullNodes(fragment, node);

			renderer._renderRec(node, pulled);
			renderer._pushNodes(pulled, node);
		});

		return fragment;
	};


	Renderer.prototype.render = function(fragment) {
		return this._renderNodes(this.template.nodes, fragment);
	};


	return Renderer;
});