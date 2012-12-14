define(['components/context', 'components/rendered'],
function(Context, RenderedTemplate) {
	var directives;

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
	
	Template.setDirectives = function(d) {
		directives = d;
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
		
		
		/* Text node rendering helpers */
		_updateTextNode: function(ctx, node, domnode) {
			domnode.data = ctx.interpolate(node.text);
		},
		
		_renderTextNode: function(ctx, node, index) {
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
			
			ctx.istData(tnode).index = index;
			
			return tnode;
		},
		
		
		/* Element rendering helpers */
		_updateElement: function(ctx, node, domnode) {
			// Set attrs, properties, events, classes and ID
			Object.keys(node.attributes).forEach(function(attr) {
				try {
					var value = ctx.interpolate(node.attributes[attr]);
				} catch (err) {
					throw this._completeError(err, node);
				}
			
				domnode.setAttribute(attr, value);
			}, this);
		
			Object.keys(node.properties).forEach(function(prop) {
				try {
					var value = ctx.interpolate(node.properties[prop]);
				} catch (err) {
					throw this._completeError(err, node);
				}
			
				domnode[prop] = value;
			}, this);
			
			if (typeof domnode._ist_detach !== 'undefined') {
				domnode._ist_detach.forEach(function(detach) {
					domnode.removeEventListener(detach.event, detach.handler, false);
				});
			}
			domnode._ist_detach = [];
			
			Object.keys(node.events).forEach(function(event) {
				node.events[event].forEach(function(expr) {
					try {
						var handler = ctx.evaluate(expr);
					} catch(err) {
						throw this._completeError(err, node);
					}
				
					domnode._ist_detach.push({ event: event, handler: handler });
					domnode.addEventListener(event, handler, false);
				}, this);
			}, this);
		},
		
		_renderElement: function(ctx, node, index) {
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
			
			this._updateElement(ctx, node, elem);
			ctx.istData(elem).index = index;
			return elem;
		},
		
		
		/* Directive rendering helpers */
		_updateDirective: function(ctx, node, domnodes) {
			
		},
		
		_renderDirective: function(ctx, node, index) {
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
				ret = helper.call(ctx, subCtx, subTemplate);
			} catch (err) {
				throw this._completeError(err, node);
			}
		
			if (typeof ret === 'undefined') {
				return ctx.createDocumentFragment();
			}
			
			if (ret.nodeType === ctx.doc.DOCUMENT_FRAGMENT_NODE) {
				for (i = 0, len = ret.childNodes.length; i < len; i++) {
					ctx.istData(ret.childNodes[i]).index = index;
				}
			} else {
				ctx.istData(ret).index = index;
			}
		
			return ret;
		},
		

		/* Look for a node with the given partial name and return a new
		   Template object if found */
		findPartial: function(name) {
			var result, rec;
			
			if (typeof name === "undefined") {
				return;
			}
			
			rec = function(name, nodes) {
				var found, i, len,
					results = nodes.filter(function(n) {
						return n.partial === name;
					});
					
				if (results.length) {
					return results[0];
				}
				
				for (i = 0, len = nodes.length; i < len; i++) {
					if (typeof nodes[i].children !== 'undefined') {
						found = rec(name, nodes[i].children);
						
						if (found) {
							return found;
						}
					}
				}
			};
				
			result = rec(name, this.nodes);
			
			if (typeof result !== 'undefined') {
				return new Template(this.name, [result]);
			}
		},
		
		
		/* Render template using 'context' in 'doc' */
		render: function(context, doc) {
			var rec, fragment, rnodes, self = this;
			
			if (!(context instanceof Context)) {
				context = new Context(context, doc);
			}
			
			if (!this.prerendered) {
				this._preRender(context.document);
			}
			
			rec = function(ctx, node, index) {
				switch (true) {
					case typeof node.text !== 'undefined':
						return self._renderTextNode(ctx, node, index);
						break;
						
					case typeof node.tagName !== 'undefined':
						var elem = self._renderElement(ctx, node, index);
						node.children.forEach(function(child, index) {
							elem.appendChild(rec(ctx, child, index));
						});
						return elem;
						break;
						
					case typeof node.directive !== 'undefined':
						return self._renderDirective(ctx, node, index);
						break;
				}
			};				
				
			fragment = context.createDocumentFragment();
			rnodes = [];
		
			this.nodes.forEach(function(node, index) {
				var rnode = rec(context, node, index);
				
				rnodes.push(rnode);
				fragment.appendChild(rnode);
			});
			
			this.lastRender = new RenderedTemplate(this, context, rnodes);
		
			return fragment;
		},
		
		
		/**/
		renderInto: function(parent, context) {
			parent.appendChild(this.render(context, parent.ownerDocument));
			return this.lastRender;
		},
		
		
		/**/
		update: function(context, rnodes) {
			var rec, findIndex, self = this;
			
			if (typeof this.lastRender === 'undefined') {
				throw new Error("Cannot update not yet rendered template");
			}
			
			context = context || this.lastRender.context;
			rnodes = rnodes || this.lastRender.nodes;
			
			if (!(context instanceof Context)) {
				context = new Context(context, this.lastRender.context.doc);
			}
			
			findIndex = function(nodes, index) {
				var i, len, idx, result = [];
				
				for (i = 0, len = nodes.length; i < len; i++) {
					idx = ctx.istData(nodes[i]).index;
					if (idx === index) {
						result.push(nodes[i]);
					}
					
					if (idx > index) {
						break;
					}
				}
				
				return result;
			};
			
			rec = function(ctx, node, rnodes) {
				switch (true) {
					case typeof node.text !== 'undefined':
						self._updateTextNode(ctx, node, rnodes[0]);
						break;
						
					case typeof node.tagName !== 'undefined':
						self._updateElement(ctx, node, rnodes[0]);
						
						node.children.forEach(function(child, index) {
							rec(ctx, child, findIndex(rnodes[0].childNodes, index));
						});
						break;
						
					case typeof node.directive !== 'undefined':
						self._updateDirective(ctx, node, rnodes);
						break;
				}
			};
			
			this.nodes.forEach(function(node, index) {
				rec(context, node, findIndex(rnodes, index));
			});
			
			this.lastRender.context = context;
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
