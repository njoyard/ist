/*global define */
define(['components/directives'], function(directives) {
	'use strict';

	function Renderer(template, context) {
		this.template = template;
		this.context = context;
	}


	Renderer.prototype._completeError = function(err, node) {
		return this.template._completeError(err, node);
	};


	/* Text node rendering helper */
	Renderer.prototype._renderTextNode = function(node) {
		var ctx = this.context,
			tnode;
		
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
	Renderer.prototype._renderElement = function(node) {
		var ctx = this.context,
			elem;
		
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
	Renderer.prototype._renderDirective = function(node) {
		var ctx = this.context,
			tmpl = this.template,
			Template = tmpl.constructor,
			subTemplate = new Template(tmpl.name, node.children),
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


	Renderer.prototype.renderRec = function(node) {
		var ctx = this.context,
			tnode;
	
		if (typeof node.text !== 'undefined') {
			tnode = this._renderTextNode(node);
		}
				
		if (typeof node.tagName !== 'undefined') {
			tnode = this._renderElement(node);

			node.children
			.map(this.renderRec, this)
			.forEach(function(cnode) {
				tnode.appendChild(cnode);
			});
		}
		
		if (typeof node.directive !== 'undefined') {
			tnode = this._renderDirective(node);
		}

		return tnode;
	};


	Renderer.prototype.render = function() {
		var fragment = this.context.createDocumentFragment();
	
		this.template.nodes
		.map(this.renderRec, this)
		.forEach(function(node) {
			fragment.appendChild(node);
		});
	
		return fragment;
	};


	return Renderer;
});