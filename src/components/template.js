define([
	'components/context',
	'components/livefragment',
	'components/directives'
],
function(Context, LiveFragment, directives) {
	var Template, findPartialRec, findIndex;
	
	
	findPartialRec = function(name, nodes) {
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
	};
	
	
	/* Extract a LiveFragment from parent where nodes have "index" value */
	findIndex = function(context, parent, index) {
		var nodes = parent.childNodes,
			result = [],
			previous = next = null,
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
	};
	

	/**
	 * Template object; encapsulate template nodes and rendering helpers
	 */
	var Template = function(name, nodes) {
		this.name = name || '<unknown>';
		this.nodes = nodes;
		
		this.prerendered = false;
		this._preRender();
		
		this.lastRender = undefined;
	};
	
	
	Template.prototype = {
		/* Prerender constant part of nodes */
		_preRender: function(doc) {
			var rec,
				expRE = /{{((?:}(?!})|[^}])*)}}/;
			
			/* Ensure we have a document, or postpone prerender */
			doc = doc || document;
			if (!doc) {
				return;
			}
			
			rec = function(node) {
				var pr;
				
				/* Constant text node */
				if (typeof node.text !== 'undefined'
						&& !expRE.test(node.text)) {
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
					node.children.forEach(rec);
				}
			};
			
			this.nodes.forEach(rec);
			this.prerendered = true;
		},
	
	
		/* Complete an Error object with information about the current
		   node and template */
		_completeError: function(err, node) {
			var current = "in '" + this.name + "' on line "
				+ (node.line || '<unknown>');
			
			if (typeof err.istStack === 'undefined') {
				err.message += " " + current;
				err.istStack = [];
			}
			
			err.istStack.push(current);
			return err;
		},
		
		
		/* Text node rendering helper */
		_renderTextNode: function(ctx, node, index, fragment) {
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
		},
		
		
		/* Element rendering helper */
		_renderElement: function(ctx, node, index, fragment) {
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
				try {
					var value = ctx.interpolate(node.attributes[attr]);
				} catch (err) {
					throw this._completeError(err, node);
				}
			
				elem.setAttribute(attr, value);
			}, this);
		
			// Set properties
			Object.keys(node.properties).forEach(function(prop) {
				try {
					var value = ctx.interpolate(node.properties[prop]);
				} catch (err) {
					throw this._completeError(err, node);
				}
			
				elem[prop] = value;
			}, this);
			
			// Remove previously set handlers
			if (data.detach) {
				data.detach.forEach(function(detach) {
					domnode.removeEventListener(detach.event, detach.handler, false);
				});
			}
			data.detach = [];
			
			// Set new handlers
			Object.keys(node.events).forEach(function(event) {
				node.events[event].forEach(function(expr) {
					try {
						var handler = ctx.evaluate(expr);
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
		},
		
		
		/* Directive rendering helpers */
		_renderDirective: function(ctx, node, index, fragment) {
			var self = this,
				subTemplate = new Template(this.name, node.children),
				helper = directives.get(node.directive),
				subCtx, ret, i, len;
		
			if (typeof helper !== 'function') {
				throw new Error('No block helper for @' + node.directive + ' has been registered');
			}
		
			if (typeof node.expr !== 'undefined') {
				try {
					subCtx = ctx.createContext(ctx.evaluate(node.expr));
				} catch(err) {
					throw this._completeError(err, node);
				}
			}
		
			try {
				helper.call(ctx, subCtx, subTemplate, fragment);
			} catch (err) {
				throw this._completeError(err, node);
			}
			
			for (i = 0, len = fragment.childNodes.length; i < len; i++) {
				ctx.istData(fragment.childNodes[i]).index = index;
			}
		},
		

		/* Look for a node with the given partial name and return a new
		   Template object if found */
		findPartial: function(name) {
			var result;
			
			if (typeof name === "undefined") {
				return;
			}
				
			result = findPartialRec(name, this.nodes);
			
			if (typeof result !== 'undefined') {
				return new Template(this.name, [result]);
			}
		},
		
		
		/* Render template using 'context' in 'doc' */
		render: function(context, doc, fragment) {
			var rec, 
				self = this;
			
			if (!(context instanceof Context)) {
				context = new Context(context, doc);
			}
			
			if (!this.prerendered) {
				this._preRender(context.document);
			}
			
			rec = function(ctx, node, index, fragment) {
				if (typeof node.text !== 'undefined') {
					return self._renderTextNode(ctx, node, index, fragment);
				}
						
				if (typeof node.tagName !== 'undefined') {
					self._renderElement(ctx, node, index, fragment);
					node.children.forEach(function(child, index) {
						rec(ctx, child, index, findIndex(ctx, fragment.firstChild, index));
					});
				}
				
				if (typeof node.directive !== 'undefined') {
					self._renderDirective(ctx, node, index, fragment);
				}
			};				
				
			if (!fragment) {
				fragment = context.createDocumentFragment();
				updating = false;
			}
		
			this.nodes.forEach(function(node, index) {
				rec(context, node, index, findIndex(context, fragment, index));
			});
		
			return fragment;
		},
		
		/* Return code to regenerate this template */
		getCode: function(pretty) {
			return "new ist.Template("
				+ JSON.stringify(this.name) + ", "
				+ JSON.stringify(this.nodes, null, pretty ? 1 : 0)
				+ ");";
		}
	};
	
	return Template;
});
