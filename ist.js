/**
 * IST: Indented Selector Templating
 * version 0.6
 *
 * Copyright (c) 2012-2013 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://njoyard.github.com/ist
 */
(function(global) {
	var isAMD = typeof global.define === 'function' && global.define.amd,
		isNode = typeof process !== "undefined" && process.versions && !!process.versions.node,
		isBrowser = typeof window !== "undefined" && window.navigator && window.document;

	var previous, istComponents;

	istComponents = { require: global.require };


	/*global define */
	istComponents.misc = (function() {
		
		
		return {
			jsEscape: function (content) {
				return content.replace(/(['\\])/g, '\\$1')
					.replace(/[\f]/g, '\\f')
					.replace(/[\b]/g, '\\b')
					.replace(/[\t]/g, '\\t')
					.replace(/[\n]/g, '\\n')
					.replace(/[\r]/g, '\\r');
			},
	
			findScript: function(id) {
				var i, len, s, found, scripts;
	
				try {
					scripts = document.querySelectorAll('script#' + id);
				} catch(e) {
					// DOM exception when selector is invalid - no <script> tag with this id
					return;
				}
					
				if (scripts) {
					for (i = 0, len = scripts.length; i < len; i++) {
						s = scripts[i];
						if (s.getAttribute('type') === 'text/x-ist') {
							return s.innerHTML;
						}
					}
				}
				
				return found;
			},
	
			appendNodeSegment: function(firstChild, lastChild, target) {
				var node = firstChild,
					end = lastChild ? lastChild.nextSibling : null,
					next;
	
				while (node && node != end) {
					next = node.nextSibling;
					target.appendChild(node);
					node = next;
				}
			},
	
			insertNodeSegmentBefore: function(firstChild, lastChild, target, ref) {
				var node = firstChild,
					end = lastChild ? lastChild.nextSibling : null,
					next;
	
				while (node && node != end) {
					next = node.nextSibling;
					target.insertBefore(node, ref);
					node = next;
				}
			}
		};
	}());
	
	/*jshint evil:true */
	/*global define*/
	istComponents.codegen = ( function(misc) {
		
	
		var expressionRE = /{{\s*((?:}(?!})|[^}])*?)\s*}}/,
			codeCache = {},
			undef = function() {};
	
		return {
			expression: function(expr) {
				var cacheKey = '{{ ' + expr + ' }}';
	
				if (!(cacheKey in codeCache)) {
					codeCache[cacheKey] = 'function(document,_istScope){' +
						'if(this!==null&&this!==undefined){' +
							'with(this){' +
								'with(_istScope){' +
									'return ' + expr + ';' +
								'}' +
							'}' +
						'}else{' +
							'with(_istScope){' +
								'return ' + expr + ';' +
							'}' +
						'}' +
					'}';
				}
	
				return codeCache[cacheKey];
			},
	
			interpolation: function(text) {
				if (!(text in codeCache)) {
					codeCache[text] = this.expression(
						text.split(expressionRE)
						.map(function(part, index) {
							if (index % 2) {
								// expression
								return '(' + part + ')';
							} else {
								// text literal
								return '\'' + misc.jsEscape(part) + '\'';
							}
						})
						.filter(function(part) {
							return part !== '\'\'';
						})
						.join('+')
					);
				}
	
				return codeCache[text];
			},
	
			directiveEvaluator: function(node) {
				if ('expr' in node) {
					return new Function('document,_istScope',
						'return (' + this.expression(node.expr) + ').call(this,document,_istScope);'
					);
				} else {
					return undef;
				}
			},
	
			elementUpdater: function(node) {
				var code = [],
					codegen = this,
					attributes = node.attributes,
					properties = node.properties,
					events = node.events;
	
				Object.keys(attributes).forEach(function(attr) {
					code.push(
						'element.setAttribute(' +
							'"' + attr + '",' +
							'(' + codegen.interpolation(attributes[attr]) + ').call(this,document,_istScope)' +
						');'
					);
				});
	
				Object.keys(properties).forEach(function(prop) {
					code.push(
						'element["' + prop + '"]=' +
							'(' + codegen.interpolation(properties[prop]) + ').call(this,document,_istScope);'
					);
				});
	
				Object.keys(events).forEach(function(evt) {
					code.push(
						'element.addEventListener(' +
							'"' + evt + '",' +
							'(' + codegen.expression(events[evt]) + ').call(this,document,_istScope),' +
							'false' +
						');'
					);
				});
	
				return new Function('document,_istScope,element', code.join(''));
			},
	
			textUpdater: function(node) {
				return new Function('document,_istScope,textNode',
					'textNode.textContent=(' + this.interpolation(node.text) + ').call(this,document,_istScope);'
				);
			}
		};
	}(istComponents.misc));
	/*jshint evil:true */
	/*global define */
	istComponents.context = ( function() {
		
	
	
		/**
		 * Context object; holds the rendering context and target document,
		 * and provides helper methods.
		 */
		function Context(object, doc) {
			this.value = object;
			this.values = [object];
	
			this.doc = doc || document;
			this.rootScope = this.scope = {};
		}
	
	
		Context.prototype = {
			/* Node creation aliases */
			importNode: function(node, deep) {
				return this.doc.importNode(node, deep);
			},
			
			createDocumentFragment: function() {
				return this.doc.createDocumentFragment();
			},
		
			createElement: function(tagName, namespace) {
				if (typeof namespace !== 'undefined') {
					return this.doc.createElementNS(namespace, tagName);
				} else {
					return this.doc.createElement(tagName);
				}
			},
		
			createTextNode: function(text) {
				return this.doc.createTextNode(text);
			},
			
			/* Push an object on the scope stack. All its properties will be
			   usable inside expressions and hide any previously available
			   property with the same name */
			pushScope: function(scope) {
				var newScope = Object.create(this.scope);
	
				Object.keys(scope).forEach(function(key) {
					newScope[key] = scope[key];
				});
	
				this.scope = newScope;
			},
			
			/* Pop the last object pushed on the scope stack  */
			popScope: function() {
				var thisScope = this.scope;
	
				if (thisScope === this.rootScope) {
					throw new Error('No scope left to pop out');
				}
	
				this.scope = Object.getPrototypeOf(thisScope);
			},
	
			pushValue: function(value) {
				this.values.unshift(value);
				this.value = value;
	
				if (value !== undefined && value !== null && typeof value !== 'string' && typeof value !== 'number') {
					this.pushScope(value);
				} else {
					this.pushScope({});
				}
			},
	
			popValue: function() {
				this.popScope();
	
				this.values.shift();
				this.value = this.values[0];
			},
	
			createContext: function(newValue) {
				return new Context(newValue, this.doc);
			},
	
			scopedCall: function(fn, target) {
				return fn.call(this.value, this.doc, this.scope, target);
			}
		};
		
		return Context;
	}());
	
	/*global define */
	istComponents.directives = (function() {
		
	
		var directives, registered,
			defined = {};
		
		/**
		 * Conditional helper for @if, @unless
		 *
		 * @param {Context} ctx rendering context
		 * @param render render template if truthy
		 * @param {Template} tmpl template to render
		 * @param {DocumentFragment} fragment target fragment
		 */
		function conditionalHelper(ctx, render, tmpl, fragment) {
			var rendered = fragment.extractRenderedFragment();
	
			if (render) {
				if (rendered) {
					rendered.update(ctx);
				} else {
					rendered = tmpl.render(ctx);
				}
	
				fragment.appendRenderedFragment(rendered);
			}
		}
	
		
		/**
		 * Iteration helper for @each, @eachkey
		 *
		 * @param {Context} ctx rendering context
		 * @param {Array} items item array to iterate over
		 * @param {Array} keys item identifiers
		 * @param [loopAdd] additional loop properties
		 * @param {Template} tmpl template to render for each item
		 * @param {DocumentFragment} fragment target fragment
		 */
		function iterationHelper(ctx, items, keys, loopAdd, tmpl, fragment) {
			var outerValue = ctx.value;
	
			/* Extract previously rendered fragments */
			var extracted = fragment.extractRenderedFragments(),
				fragKeys = extracted.keys,
				fragments = extracted.fragments;
			
			/* Loop over array and append rendered fragments */
			items.forEach(function itemIterator(item, index) {
				ctx.pushValue(item);
	
				/* Create subcontext */
				var loop = {
					first: index === 0,
					index: index,
					last: index == items.length - 1,
					length: items.length,
					outer: outerValue
				};
	
				if (loopAdd) {
					Object.keys(loopAdd).forEach(function(key) {
						loop[key] = loopAdd[key];
					});
				}
	
				ctx.pushScope({ loop: loop });
	
				/* Render or update fragments */
				var keyIndex = fragKeys.indexOf(keys[index]),
					rendered;
	
				if (keyIndex === -1) {
					/* Item was not rendered yet */
					rendered = tmpl.render(ctx);
				} else {
					rendered = fragments[keyIndex];
					rendered.update(ctx);
				}
	
				ctx.popScope();
				ctx.popValue();
	
				fragment.appendRenderedFragment(rendered, keys[index]);
			});
		}
		
		
		/* Built-in directive helpers (except @include) */
		registered = {
			'if': function ifHelper(ctx, value, tmpl, fragment) {
				conditionalHelper.call(null, ctx, value, tmpl, fragment);
			},
	
			'unless': function unlessHelper(ctx, value, tmpl, fragment) {
				conditionalHelper.call(null, ctx, !value, tmpl, fragment);
			},
	
			'with': function withHelper(ctx, value, tmpl, fragment) {
				var rendered = fragment.extractRenderedFragment();
	
				ctx.pushValue(value);
	
				if (rendered) {
					rendered.update(ctx);
				} else {
					rendered = tmpl.render(ctx);
				}
	
				ctx.popValue();
	
				fragment.appendChild(tmpl.render(value));
			},
	
			'each': function eachHelper(ctx, value, tmpl, fragment) {
				if (!Array.isArray(value)) {
					throw new Error(value + ' is not an array');
				}
				
				iterationHelper(ctx, value, value, null, tmpl, fragment);
			},
	
			'eachkey': (function() {
				function extractItem(k) {
					return { key: k, value: this[k] };
				}
	
				return function eachkeyHelper(ctx, value, tmpl, fragment) {
					var keys = Object.keys(value),
						array;
						
					array = keys.map(extractItem, value);
					iterationHelper(ctx, array, keys, { object: value }, tmpl, fragment);
				};
			}()),
	
			'dom': function domHelper(ctx, value, tmpl, fragment) {
				if (value.ownerDocument !== ctx.doc) {
					value = ctx.doc.importNode(value);
				}
	
				while(fragment.hasChildNodes()) {
					fragment.removeChild(fragment.firstChild);
				}
				fragment.appendChild(value);
			},
	
			'define': function defineHelper(ctx, value, tmpl, fragment) {
				defined[value] = tmpl;
			},
	
			'use': function useHelper(ctx, value, tmpl, fragment) {
				var template = defined[value];
	
				if (!template) {
					throw new Error('Template \'' + value + '\' has not been @defined');
				}
	
				var rendered = fragment.extractRenderedFragment();
	
				if (rendered) {
					rendered.update(ctx);
				} else {
					rendered = template.render(ctx);
				}
	
				fragment.appendRenderedFragment(rendered);
			}
		};
		
		/* Directive manager object */
		directives = {
			register: function registerDirective(name, helper) {
				registered[name] = helper;
			},
	
			get: function getDirective(name) {
				return registered[name];
			}
		};
		
		return directives;
	}());
	
	/*global define */
	istComponents.rendereddirective = ( function(misc) {
		
	
	
		function appendRenderedFragment(fragment, key) {
			/*jshint validthis:true */
			this._istKeyIndex.push(key);
			this._istFragIndex.push({
				firstChild: fragment.firstChild,
				lastChild: fragment.lastChild,
				update: fragment.update
			});
	
			this.appendChild(fragment);
		}
	
	
		function extractRenderedFragments() {
			/*jshint validthis:true */
			var ctx = this._istContext,
				keyIndex = this._istKeyIndex,
				fragIndex = this._istFragIndex,
				extracted = {
					keys: keyIndex.slice(),
					fragments: fragIndex.map(function(item) {
						var frag = ctx.createDocumentFragment();
	
						misc.appendNodeSegment(item.firstChild, item.lastChild, frag);
						frag.update = item.update;
	
						return frag;
					})
				};
	
			keyIndex.splice(0, keyIndex.length);
			fragIndex.splice(0, fragIndex.length);
	
			return extracted;
		}
	
	
		function extractRenderedFragment(key) {
			/*jshint validthis:true */
			var ctx = this._istContext,
				keyIndex = this._istKeyIndex,
				fragIndex = this._istFragIndex,
				position = keyIndex.indexOf(key),
				item, fragment;
	
			if (position !== -1) {
				item = fragIndex[position];
				fragment = ctx.createDocumentFragment();
	
				misc.appendNodeSegment(item.firstChild, item.lastChild, fragment);
				fragment.update = item.update;
	
				keyIndex.splice(position, 1);
				fragIndex.splice(position, 1);
	
				return fragment;
			}
		}
	
	
	
		function RenderedDirective() {
			this.firstChild = null;
			this.lastChild = null;
			this.keyIndex = [];
			this.fragIndex = [];
		}
	
	
		RenderedDirective.prototype.createFragment = function(ctx) {
			var fragment = ctx.createDocumentFragment();
	
			fragment._istContext = ctx;
			fragment._istKeyIndex = this.keyIndex;
			fragment._istFragIndex = this.fragIndex;
	
			fragment.appendRenderedFragment = appendRenderedFragment;
			fragment.extractRenderedFragment = extractRenderedFragment;
			fragment.extractRenderedFragments = extractRenderedFragments;
	
			misc.appendNodeSegment(this.firstChild, this.lastChild, fragment);
	
			return fragment;
		};
	
	
		RenderedDirective.prototype.updateFromFragment = function(fragment) {
			this.firstChild = fragment.firstChild;
			this.lastChild = fragment.lastChild;
		};
	
	
		return RenderedDirective;
	}(istComponents.misc));
	/*global define */
	istComponents.renderedtree = ( function(RenderedDirective, misc) {
		
	
		function RenderedTree(element, childrenIndex) {
			this.element = element;
			this.childrenIndex = childrenIndex || [];
			this.appendDone = false;
		}
	
	
		/**
		 * Loop over `templateNodes`, calling `fn` with context `that` with
		 * each template node and the element from this.childrenIndex at the
		 * same position
		 */
		RenderedTree.prototype.forEach = function(templateNodes, fn, that) {
			var index = this.childrenIndex;
	
			templateNodes.forEach(function(node, i) {
				index[i] = fn.call(this, node, index[i]);
			}, that);
		};
	
	
		// FIXME only used on root tree when updating, maybe move this to Renderer ?
		RenderedTree.prototype.updateParent = function() {
			var item = this.childrenIndex[0];
	
			// TODO better handle the case where no nodes have been rendered
			if (item) {
				this.element = null;
				if (item instanceof RenderedTree) {
					this.element = item.element.parentNode;
				} else if (item instanceof RenderedDirective) {
					this.element = item.firstChild.parentNode;
				} else {
					this.element = item.parentNode;
				}
			}
		};
	
	
		RenderedTree.prototype.appendChildren = function() {
			var parent = this.element,
				index = this.childrenIndex;
	
			if (parent) {
				if (!this.appendDone) {
					index.forEach(function(indexItem) {
						if (indexItem instanceof RenderedTree) {
							parent.appendChild(indexItem.element);
						} else if (indexItem instanceof RenderedDirective) {
							misc.appendNodeSegment(indexItem.firstChild, indexItem.lastChild, parent);
						} else {
							parent.appendChild(indexItem);
						}
					});
	
					this.appendDone = true;
				} else {
					var nextSibling = null;
	
					for (var i = index.length - 1; i >= 0; i--) {
						var indexItem = index[i];
	
						if (indexItem instanceof RenderedTree) {
							nextSibling = indexItem.element;
						} else if (indexItem instanceof RenderedDirective) {
							misc.insertNodeSegmentBefore(
								indexItem.firstChild,
								indexItem.lastChild,
								parent,
								nextSibling
							);
	
							nextSibling = indexItem.firstChild || nextSibling;
						} else {
							nextSibling = indexItem;
						}
					}
				}
			}
		};
	
		return RenderedTree;
	}(istComponents.rendereddirective, istComponents.misc));
	/*global define */
	istComponents.renderer = (
	function(Context, directives, RenderedTree, RenderedDirective) {
		
	
	
		function Renderer(template) {
			this.template = template;
			this.context = undefined;
		}
	
	
		Renderer.prototype.setContext = function(context, doc) {
			doc = doc || (this.context ? this.context.doc : document);
	
			if (context instanceof Context) {
				this.context = context;
			} else {
				this.context = new Context(context, doc);
			}
		};
	
	
		/* Error completion helper */
		Renderer.prototype._completeError = function(err, node) {
			return this.template._completeError(err, node);
		};
	
	
		/* Text node rendering helper */
		Renderer.prototype._renderTextNode = function(node, textNode) {
			var ctx = this.context;
	
			if (!textNode) {
				if ('pr' in node) {
					textNode = ctx.importNode(node.pr, false);
				} else {
					textNode = ctx.createTextNode('');
				}
			}
	
			if (!('pr' in node)) {
				try {
					ctx.scopedCall(node.updater, textNode);
				} catch (err) {
					throw this._completeError(err, node);
				}
			}
	
			return textNode;
		};
	
		
		/* Element rendering helper */
		Renderer.prototype._renderElement = function(node, elementNode) {
			var ctx = this.context;
	
			if (!elementNode) {
				elementNode = ctx.importNode(node.pr, false);
			}
	
			try {
				ctx.scopedCall(node.updater, elementNode);
			} catch(err) {
				throw this._completeError(err, node);
			}
			
			return elementNode;
		};
		
		
		/* Directive rendering helpers */
		Renderer.prototype._renderDirective = function(node, renderedDirective) {
			var ctx = this.context,
				pr = node.pr,
				helper = directives.get(node.directive);
	
			if (typeof helper !== 'function') {
				throw new Error('No directive helper for @' + node.directive + ' has been registered');
			}
	
			if (!renderedDirective) {
				renderedDirective = new RenderedDirective();
			}
	
			var fragment = renderedDirective.createFragment(ctx);
		
			try {
				helper.call(null, ctx, ctx.scopedCall(pr.evaluator), pr.template, fragment);
			} catch (err) {
				throw this._completeError(err, node);
			}
	
			renderedDirective.updateFromFragment(fragment);
			return renderedDirective;
		};
	
	
	
	
		Renderer.prototype._renderRec = function(node, indexEntry) {
			if ('text' in node) {
				indexEntry = this._renderTextNode(node, indexEntry);
			}
					
			if ('tagName' in node) {
				if (indexEntry) {
					indexEntry.element = this._renderElement(node, indexEntry.element);
				} else {
					indexEntry = new RenderedTree(this._renderElement(node));
				}
	
				this._renderNodes(node.children, indexEntry);
			}
			
			if ('directive' in node) {
				indexEntry = this._renderDirective(node, indexEntry);
			}
	
			return indexEntry;
		};
	
	
		Renderer.prototype._renderNodes = function(nodes, tree) {
			tree.forEach(nodes, this._renderRec, this);
			tree.appendChildren();
		};
	
	
		Renderer.prototype.render = function() {
			var renderer = this,
				fragment = this.context.createDocumentFragment(),
				nodes = this.template.nodes,
				tree = new RenderedTree(fragment);
	
			this._renderNodes(nodes, tree);
	
			fragment.update = function(ctx) {
				if (ctx) {
					renderer.setContext(ctx);
				}
	
				tree.updateParent();
				renderer._renderNodes(nodes, tree);
			};
	
			return fragment;
		};
	
	
		return Renderer;
	}(istComponents.context, istComponents.directives, istComponents.renderedtree, istComponents.rendereddirective));
	/*global define, console */
	istComponents.template = (
	function(codegen, Context, Renderer) {
		
	
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
	}(
		istComponents.codegen,
		istComponents.context,
		istComponents.renderer
	));
	
	istComponents.parsehelpers = (function() {
		var UNCHANGED = 'U', INDENT = 'I', DEDENT = 'D', UNDEF,
			textToJSON, elemToJSON, directiveToJSON,
			helpers = {};
			
		
		textToJSON = function() {
			return { text: this.text, line: this.line };
		};
		
		elemToJSON =  function() {
			var o = {
					tagName: this.tagName,
					line: this.line,
					classes: this.classes,
					attributes: this.attributes,
					properties: this.properties,
					events: this.events,
					children: this.children
				};
			
			if (typeof this.id !== 'undefined') {
				o.id = this.id;
			}
		
			if (typeof this.partial !== 'undefined') {
				o.partial = this.partial;
			}
		
			return o;
		};
		
		directiveToJSON = function() {
			return {
				directive: this.directive,
				expr: this.expr,
				line: this.line,
				children: this.children
			};
		};
	
		// Generate node tree
		helpers.generateNodeTree = function(first, tail) {
			var root = { children: [] },
				stack = [root],
				nodeCount = 0,
				lines, peekNode, pushNode, popNode;
			
			if (!first) {
				return root.children;
			}
			
			/* Node stack helpers */
		
			peekNode = function() {
				return stack[stack.length - 1];
			};
	
			pushNode = function(node) {
				nodeCount++;
				stack.push(node);
			};
	
			popNode = function(lineNumber) {
				var node;
				if (stack.length < 2) {
					throw new Error("Could not pop node from stack");
				}
		
				node = stack.pop();
				peekNode().children.push(node);
			
				return node;
			};
		
			// Remove newlines
			lines = tail.map(function(item) { return item.pop(); });
			lines.unshift(first);
	
			lines.forEach(function(line, index) {
				var indent = line.indent,
					item = line.item,
					lineNumber = line.num,
					err;
				
				if (indent[0] instanceof Error) {
					throw indent[0];
				}
			
				if (nodeCount > 0) {
					if (indent[0] === UNCHANGED) {
						// Same indent: previous node won't have any children
						popNode();
					} else if (indent[0] === DEDENT) {
						// Pop nodes in their parent
						popNode();
				
						while (indent.length > 0) {
							indent.pop();
							popNode();
						}
					} else if (indent[0] === INDENT && typeof peekNode().text !== 'undefined') {
						err = new Error("Cannot add children to text node");
						err.line = lineNumber;
						throw err;
					}
				}
			
				pushNode(item);
			});
		
			// Collapse remaining stack
			while (stack.length > 1) {
				popNode();
			}
		
			return root.children;
		};
	
		// Keep track of indent
		helpers.parseIndent = function(depths, s, line) {
			var depth = s.length,
				dents = [],
				err;
	
			if (depth.length === 0) {
				// First line, this is the reference indent
				depths.push(depth);
			}
	
			if (depth == depths[0]) {
				// Same indent as previous line
				return [UNCHANGED];
			}
	
			if (depth > depths[0]) {
				// Deeper indent, unshift it
				depths.unshift(depth);
				return [INDENT];
			}
		
			while (depth < depths[0]) {
				// Narrower indent, try to find it in previous indents
				depths.shift();
				dents.push(DEDENT);
			}
	
			if (depth != depths[0]) {
				// No matching previous indent
				err = new Error("Unexpected indent");
				err.line = line;
				err.column = 1;
				return [err];
			}
	
			return dents;
		};
	
		// Text node helper
		helpers.createTextNode = function(text, line) {
			return {
				text: text,
				line: line,
				toJSON: textToJSON
			};
		};
	
		// Element object helper
		helpers.createElement = function(tagName, qualifiers, additions, line) {
			var elem = {
				tagName: tagName,
				line: line,
				classes: [],
				attributes: {},
				properties: {},
				events: {},
				children: [],
				toJSON: elemToJSON
			};
	
			qualifiers.forEach(function(q) {
				if (typeof q.id !== 'undefined') {
					elem.id = q.id;
				} else if (typeof q.className !== 'undefined') {
					elem.classes.push(q.className);
				} else if (typeof q.attr !== 'undefined') {
					elem.attributes[q.attr] = q.value;
				} else if (typeof q.prop !== 'undefined') {
					elem.properties[q.prop] = q.value;
				} else if (typeof q.event !== 'undefined') {
					if (typeof elem.events[q.event] === 'undefined') {
						elem.events[q.event] = [];
					}
				
					elem.events[q.event].push(q.value);
				}
			});
		
			if (typeof additions !== 'undefined') {
				if (additions.partial.length > 0) {
					elem.partial = additions.partial;
				}
			
				if (typeof additions.textnode !== 'undefined'
					&& typeof additions.textnode.text !== 'undefined') {
					elem.children.push(additions.textnode);
				}
			}
	
			return elem;
		};
	
		// Directive object helper
		helpers.createDirective = function(name, expr, line) {
			return {
				directive: name,
				expr: expr,
				line: line,
				children: [],
				toJSON: directiveToJSON
			};
		};
	
		helpers.escapedCharacter = function(char) {
			if (char.length > 1) {
				// 2 or 4 hex digits coming from \xNN or \uNNNN
				return String.fromCharCode(parseInt(char, 16));
			} else {
				return { 'f': '\f', 'b': '\b', 't': '\t', 'n': '\n', 'r': '\r' }[char] || char;
			}
		};
		
		return helpers;
	}());
	
	istComponents.parser = ( function(helpers) {
		var pegjsParser;
	pegjsParser = (function(){
	  /*
	   * Generated by PEG.js 0.7.0.
	   *
	   * http://pegjs.majda.cz/
	   */
	  
	  function quote(s) {
	    /*
	     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
	     * string literal except for the closing quote character, backslash,
	     * carriage return, line separator, paragraph separator, and line feed.
	     * Any character may appear in the form of an escape sequence.
	     *
	     * For portability, we also escape escape all control and non-ASCII
	     * characters. Note that "\0" and "\v" escape sequences are not used
	     * because JSHint does not like the first and IE the second.
	     */
	     return '"' + s
	      .replace(/\\/g, '\\\\')  // backslash
	      .replace(/"/g, '\\"')    // closing quote character
	      .replace(/\x08/g, '\\b') // backspace
	      .replace(/\t/g, '\\t')   // horizontal tab
	      .replace(/\n/g, '\\n')   // line feed
	      .replace(/\f/g, '\\f')   // form feed
	      .replace(/\r/g, '\\r')   // carriage return
	      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
	      + '"';
	  }
	  
	  var result = {
	    /*
	     * Parses the input with a generated parser. If the parsing is successfull,
	     * returns a value explicitly or implicitly specified by the grammar from
	     * which the parser was generated (see |PEG.buildParser|). If the parsing is
	     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
	     */
	    parse: function(input, startRule) {
	      var parseFunctions = {
	        "templateLines": parse_templateLines,
	        "__": parse___,
	        "line": parse_line,
	        "indent": parse_indent,
	        "newline": parse_newline,
	        "character": parse_character,
	        "identifier": parse_identifier,
	        "partial": parse_partial,
	        "elemId": parse_elemId,
	        "elemClass": parse_elemClass,
	        "squareBracketsValue": parse_squareBracketsValue,
	        "elemAttribute": parse_elemAttribute,
	        "elemProperty": parse_elemProperty,
	        "elemEventHandler": parse_elemEventHandler,
	        "elemQualifier": parse_elemQualifier,
	        "element": parse_element,
	        "implicitElement": parse_implicitElement,
	        "explicitElement": parse_explicitElement,
	        "elementAdditions": parse_elementAdditions,
	        "textNode": parse_textNode,
	        "escapedUnicode": parse_escapedUnicode,
	        "escapedASCII": parse_escapedASCII,
	        "escapedCharacter": parse_escapedCharacter,
	        "doubleQuotedText": parse_doubleQuotedText,
	        "singleQuotedText": parse_singleQuotedText,
	        "quotedText": parse_quotedText,
	        "directive": parse_directive,
	        "simpleDirective": parse_simpleDirective,
	        "exprDirective": parse_exprDirective
	      };
	      
	      if (startRule !== undefined) {
	        if (parseFunctions[startRule] === undefined) {
	          throw new Error("Invalid rule name: " + quote(startRule) + ".");
	        }
	      } else {
	        startRule = "templateLines";
	      }
	      
	      var pos = { offset: 0, line: 1, column: 1, seenCR: false };
	      var reportFailures = 0;
	      var rightmostFailuresPos = { offset: 0, line: 1, column: 1, seenCR: false };
	      var rightmostFailuresExpected = [];
	      
	      function padLeft(input, padding, length) {
	        var result = input;
	        
	        var padLength = length - input.length;
	        for (var i = 0; i < padLength; i++) {
	          result = padding + result;
	        }
	        
	        return result;
	      }
	      
	      function escape(ch) {
	        var charCode = ch.charCodeAt(0);
	        var escapeChar;
	        var length;
	        
	        if (charCode <= 0xFF) {
	          escapeChar = 'x';
	          length = 2;
	        } else {
	          escapeChar = 'u';
	          length = 4;
	        }
	        
	        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
	      }
	      
	      function clone(object) {
	        var result = {};
	        for (var key in object) {
	          result[key] = object[key];
	        }
	        return result;
	      }
	      
	      function advance(pos, n) {
	        var endOffset = pos.offset + n;
	        
	        for (var offset = pos.offset; offset < endOffset; offset++) {
	          var ch = input.charAt(offset);
	          if (ch === "\n") {
	            if (!pos.seenCR) { pos.line++; }
	            pos.column = 1;
	            pos.seenCR = false;
	          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
	            pos.line++;
	            pos.column = 1;
	            pos.seenCR = true;
	          } else {
	            pos.column++;
	            pos.seenCR = false;
	          }
	        }
	        
	        pos.offset += n;
	      }
	      
	      function matchFailed(failure) {
	        if (pos.offset < rightmostFailuresPos.offset) {
	          return;
	        }
	        
	        if (pos.offset > rightmostFailuresPos.offset) {
	          rightmostFailuresPos = clone(pos);
	          rightmostFailuresExpected = [];
	        }
	        
	        rightmostFailuresExpected.push(failure);
	      }
	      
	      function parse_templateLines() {
	        var result0, result1, result2, result3, result4;
	        var pos0, pos1, pos2;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        result0 = [];
	        result1 = parse_newline();
	        while (result1 !== null) {
	          result0.push(result1);
	          result1 = parse_newline();
	        }
	        if (result0 !== null) {
	          result1 = parse_line();
	          result1 = result1 !== null ? result1 : "";
	          if (result1 !== null) {
	            result2 = [];
	            pos2 = clone(pos);
	            result4 = parse_newline();
	            if (result4 !== null) {
	              result3 = [];
	              while (result4 !== null) {
	                result3.push(result4);
	                result4 = parse_newline();
	              }
	            } else {
	              result3 = null;
	            }
	            if (result3 !== null) {
	              result4 = parse_line();
	              if (result4 !== null) {
	                result3 = [result3, result4];
	              } else {
	                result3 = null;
	                pos = clone(pos2);
	              }
	            } else {
	              result3 = null;
	              pos = clone(pos2);
	            }
	            while (result3 !== null) {
	              result2.push(result3);
	              pos2 = clone(pos);
	              result4 = parse_newline();
	              if (result4 !== null) {
	                result3 = [];
	                while (result4 !== null) {
	                  result3.push(result4);
	                  result4 = parse_newline();
	                }
	              } else {
	                result3 = null;
	              }
	              if (result3 !== null) {
	                result4 = parse_line();
	                if (result4 !== null) {
	                  result3 = [result3, result4];
	                } else {
	                  result3 = null;
	                  pos = clone(pos2);
	                }
	              } else {
	                result3 = null;
	                pos = clone(pos2);
	              }
	            }
	            if (result2 !== null) {
	              result3 = [];
	              result4 = parse_newline();
	              while (result4 !== null) {
	                result3.push(result4);
	                result4 = parse_newline();
	              }
	              if (result3 !== null) {
	                result0 = [result0, result1, result2, result3];
	              } else {
	                result0 = null;
	                pos = clone(pos1);
	              }
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, first, tail) { return helpers.generateNodeTree(first, tail); })(pos0.offset, pos0.line, pos0.column, result0[1], result0[2]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse___() {
	        var result0;
	        
	        reportFailures++;
	        if (/^[ \t]/.test(input.charAt(pos.offset))) {
	          result0 = input.charAt(pos.offset);
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("[ \\t]");
	          }
	        }
	        reportFailures--;
	        if (reportFailures === 0 && result0 === null) {
	          matchFailed("whitespace");
	        }
	        return result0;
	      }
	      
	      function parse_line() {
	        var result0, result1, result2, result3;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        result0 = parse_indent();
	        if (result0 !== null) {
	          result1 = parse_element();
	          if (result1 === null) {
	            result1 = parse_textNode();
	            if (result1 === null) {
	              result1 = parse_directive();
	            }
	          }
	          if (result1 !== null) {
	            result2 = [];
	            result3 = parse___();
	            while (result3 !== null) {
	              result2.push(result3);
	              result3 = parse___();
	            }
	            if (result2 !== null) {
	              result0 = [result0, result1, result2];
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, depth, s) { return { indent: depth, item: s, num: line }; })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_indent() {
	        var result0, result1;
	        var pos0;
	        
	        reportFailures++;
	        pos0 = clone(pos);
	        result0 = [];
	        result1 = parse___();
	        while (result1 !== null) {
	          result0.push(result1);
	          result1 = parse___();
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, s) { return helpers.parseIndent(depths, s, line); })(pos0.offset, pos0.line, pos0.column, result0);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        reportFailures--;
	        if (reportFailures === 0 && result0 === null) {
	          matchFailed("indent");
	        }
	        return result0;
	      }
	      
	      function parse_newline() {
	        var result0;
	        
	        reportFailures++;
	        if (input.charCodeAt(pos.offset) === 10) {
	          result0 = "\n";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"\\n\"");
	          }
	        }
	        reportFailures--;
	        if (reportFailures === 0 && result0 === null) {
	          matchFailed("new line");
	        }
	        return result0;
	      }
	      
	      function parse_character() {
	        var result0;
	        
	        reportFailures++;
	        if (/^[^\n]/.test(input.charAt(pos.offset))) {
	          result0 = input.charAt(pos.offset);
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("[^\\n]");
	          }
	        }
	        reportFailures--;
	        if (reportFailures === 0 && result0 === null) {
	          matchFailed("character");
	        }
	        return result0;
	      }
	      
	      function parse_identifier() {
	        var result0, result1, result2;
	        var pos0, pos1;
	        
	        reportFailures++;
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (/^[a-z_]/i.test(input.charAt(pos.offset))) {
	          result0 = input.charAt(pos.offset);
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("[a-z_]i");
	          }
	        }
	        if (result0 !== null) {
	          result1 = [];
	          if (/^[a-z0-9_\-]/i.test(input.charAt(pos.offset))) {
	            result2 = input.charAt(pos.offset);
	            advance(pos, 1);
	          } else {
	            result2 = null;
	            if (reportFailures === 0) {
	              matchFailed("[a-z0-9_\\-]i");
	            }
	          }
	          while (result2 !== null) {
	            result1.push(result2);
	            if (/^[a-z0-9_\-]/i.test(input.charAt(pos.offset))) {
	              result2 = input.charAt(pos.offset);
	              advance(pos, 1);
	            } else {
	              result2 = null;
	              if (reportFailures === 0) {
	                matchFailed("[a-z0-9_\\-]i");
	              }
	            }
	          }
	          if (result1 !== null) {
	            result0 = [result0, result1];
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, h, t) { return h + t.join(''); })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        reportFailures--;
	        if (reportFailures === 0 && result0 === null) {
	          matchFailed("identifier");
	        }
	        return result0;
	      }
	      
	      function parse_partial() {
	        var result0, result1;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 33) {
	          result0 = "!";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"!\"");
	          }
	        }
	        if (result0 !== null) {
	          result1 = parse_identifier();
	          if (result1 !== null) {
	            result0 = [result0, result1];
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, name) { return name; })(pos0.offset, pos0.line, pos0.column, result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_elemId() {
	        var result0, result1;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 35) {
	          result0 = "#";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"#\"");
	          }
	        }
	        if (result0 !== null) {
	          result1 = parse_identifier();
	          if (result1 !== null) {
	            result0 = [result0, result1];
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, id) { return { 'id': id }; })(pos0.offset, pos0.line, pos0.column, result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_elemClass() {
	        var result0, result1;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 46) {
	          result0 = ".";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\".\"");
	          }
	        }
	        if (result0 !== null) {
	          result1 = parse_identifier();
	          if (result1 !== null) {
	            result0 = [result0, result1];
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, cls) { return { 'className': cls }; })(pos0.offset, pos0.line, pos0.column, result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_squareBracketsValue() {
	        var result0, result1;
	        var pos0;
	        
	        pos0 = clone(pos);
	        result0 = [];
	        result1 = parse_escapedCharacter();
	        if (result1 === null) {
	          if (/^[^\\\n\]]/.test(input.charAt(pos.offset))) {
	            result1 = input.charAt(pos.offset);
	            advance(pos, 1);
	          } else {
	            result1 = null;
	            if (reportFailures === 0) {
	              matchFailed("[^\\\\\\n\\]]");
	            }
	          }
	        }
	        while (result1 !== null) {
	          result0.push(result1);
	          result1 = parse_escapedCharacter();
	          if (result1 === null) {
	            if (/^[^\\\n\]]/.test(input.charAt(pos.offset))) {
	              result1 = input.charAt(pos.offset);
	              advance(pos, 1);
	            } else {
	              result1 = null;
	              if (reportFailures === 0) {
	                matchFailed("[^\\\\\\n\\]]");
	              }
	            }
	          }
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, chars) { return chars.join(''); })(pos0.offset, pos0.line, pos0.column, result0);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_elemAttribute() {
	        var result0, result1, result2, result3, result4;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 91) {
	          result0 = "[";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"[\"");
	          }
	        }
	        if (result0 !== null) {
	          result1 = parse_identifier();
	          if (result1 !== null) {
	            if (input.charCodeAt(pos.offset) === 61) {
	              result2 = "=";
	              advance(pos, 1);
	            } else {
	              result2 = null;
	              if (reportFailures === 0) {
	                matchFailed("\"=\"");
	              }
	            }
	            if (result2 !== null) {
	              result3 = parse_squareBracketsValue();
	              if (result3 !== null) {
	                if (input.charCodeAt(pos.offset) === 93) {
	                  result4 = "]";
	                  advance(pos, 1);
	                } else {
	                  result4 = null;
	                  if (reportFailures === 0) {
	                    matchFailed("\"]\"");
	                  }
	                }
	                if (result4 !== null) {
	                  result0 = [result0, result1, result2, result3, result4];
	                } else {
	                  result0 = null;
	                  pos = clone(pos1);
	                }
	              } else {
	                result0 = null;
	                pos = clone(pos1);
	              }
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, attr, value) { return { 'attr': attr, 'value': value }; })(pos0.offset, pos0.line, pos0.column, result0[1], result0[3]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_elemProperty() {
	        var result0, result1, result2, result3, result4, result5;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 91) {
	          result0 = "[";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"[\"");
	          }
	        }
	        if (result0 !== null) {
	          if (input.charCodeAt(pos.offset) === 46) {
	            result1 = ".";
	            advance(pos, 1);
	          } else {
	            result1 = null;
	            if (reportFailures === 0) {
	              matchFailed("\".\"");
	            }
	          }
	          if (result1 !== null) {
	            result2 = parse_identifier();
	            if (result2 !== null) {
	              if (input.charCodeAt(pos.offset) === 61) {
	                result3 = "=";
	                advance(pos, 1);
	              } else {
	                result3 = null;
	                if (reportFailures === 0) {
	                  matchFailed("\"=\"");
	                }
	              }
	              if (result3 !== null) {
	                result4 = parse_squareBracketsValue();
	                if (result4 !== null) {
	                  if (input.charCodeAt(pos.offset) === 93) {
	                    result5 = "]";
	                    advance(pos, 1);
	                  } else {
	                    result5 = null;
	                    if (reportFailures === 0) {
	                      matchFailed("\"]\"");
	                    }
	                  }
	                  if (result5 !== null) {
	                    result0 = [result0, result1, result2, result3, result4, result5];
	                  } else {
	                    result0 = null;
	                    pos = clone(pos1);
	                  }
	                } else {
	                  result0 = null;
	                  pos = clone(pos1);
	                }
	              } else {
	                result0 = null;
	                pos = clone(pos1);
	              }
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, prop, value) { return { 'prop': prop, 'value': value }; })(pos0.offset, pos0.line, pos0.column, result0[2], result0[4]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_elemEventHandler() {
	        var result0, result1, result2, result3, result4, result5;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 91) {
	          result0 = "[";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"[\"");
	          }
	        }
	        if (result0 !== null) {
	          if (input.charCodeAt(pos.offset) === 33) {
	            result1 = "!";
	            advance(pos, 1);
	          } else {
	            result1 = null;
	            if (reportFailures === 0) {
	              matchFailed("\"!\"");
	            }
	          }
	          if (result1 !== null) {
	            result2 = parse_identifier();
	            if (result2 !== null) {
	              if (input.charCodeAt(pos.offset) === 61) {
	                result3 = "=";
	                advance(pos, 1);
	              } else {
	                result3 = null;
	                if (reportFailures === 0) {
	                  matchFailed("\"=\"");
	                }
	              }
	              if (result3 !== null) {
	                result4 = parse_squareBracketsValue();
	                if (result4 !== null) {
	                  if (input.charCodeAt(pos.offset) === 93) {
	                    result5 = "]";
	                    advance(pos, 1);
	                  } else {
	                    result5 = null;
	                    if (reportFailures === 0) {
	                      matchFailed("\"]\"");
	                    }
	                  }
	                  if (result5 !== null) {
	                    result0 = [result0, result1, result2, result3, result4, result5];
	                  } else {
	                    result0 = null;
	                    pos = clone(pos1);
	                  }
	                } else {
	                  result0 = null;
	                  pos = clone(pos1);
	                }
	              } else {
	                result0 = null;
	                pos = clone(pos1);
	              }
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, event, value) { return { 'event': event, 'value': value }; })(pos0.offset, pos0.line, pos0.column, result0[2], result0[4]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_elemQualifier() {
	        var result0;
	        
	        reportFailures++;
	        result0 = parse_elemId();
	        if (result0 === null) {
	          result0 = parse_elemClass();
	          if (result0 === null) {
	            result0 = parse_elemAttribute();
	            if (result0 === null) {
	              result0 = parse_elemProperty();
	              if (result0 === null) {
	                result0 = parse_elemEventHandler();
	              }
	            }
	          }
	        }
	        reportFailures--;
	        if (reportFailures === 0 && result0 === null) {
	          matchFailed("element qualifier");
	        }
	        return result0;
	      }
	      
	      function parse_element() {
	        var result0;
	        
	        reportFailures++;
	        result0 = parse_implicitElement();
	        if (result0 === null) {
	          result0 = parse_explicitElement();
	        }
	        reportFailures--;
	        if (reportFailures === 0 && result0 === null) {
	          matchFailed("element");
	        }
	        return result0;
	      }
	      
	      function parse_implicitElement() {
	        var result0, result1;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        result1 = parse_elemQualifier();
	        if (result1 !== null) {
	          result0 = [];
	          while (result1 !== null) {
	            result0.push(result1);
	            result1 = parse_elemQualifier();
	          }
	        } else {
	          result0 = null;
	        }
	        if (result0 !== null) {
	          result1 = parse_elementAdditions();
	          if (result1 !== null) {
	            result0 = [result0, result1];
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, qualifiers, additions) { return helpers.createElement('div', qualifiers, additions, line); })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_explicitElement() {
	        var result0, result1, result2;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        result0 = parse_identifier();
	        if (result0 !== null) {
	          result1 = [];
	          result2 = parse_elemQualifier();
	          while (result2 !== null) {
	            result1.push(result2);
	            result2 = parse_elemQualifier();
	          }
	          if (result1 !== null) {
	            result2 = parse_elementAdditions();
	            if (result2 !== null) {
	              result0 = [result0, result1, result2];
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, tagName, qualifiers, additions) { return helpers.createElement(tagName, qualifiers, additions, line); })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1], result0[2]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_elementAdditions() {
	        var result0, result1, result2;
	        var pos0, pos1, pos2, pos3;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        pos2 = clone(pos);
	        pos3 = clone(pos);
	        result1 = parse___();
	        if (result1 !== null) {
	          result0 = [];
	          while (result1 !== null) {
	            result0.push(result1);
	            result1 = parse___();
	          }
	        } else {
	          result0 = null;
	        }
	        if (result0 !== null) {
	          result1 = parse_textNode();
	          if (result1 !== null) {
	            result0 = [result0, result1];
	          } else {
	            result0 = null;
	            pos = clone(pos3);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos3);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, t) { return t; })(pos2.offset, pos2.line, pos2.column, result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos2);
	        }
	        result0 = result0 !== null ? result0 : "";
	        if (result0 !== null) {
	          pos2 = clone(pos);
	          pos3 = clone(pos);
	          result2 = parse___();
	          if (result2 !== null) {
	            result1 = [];
	            while (result2 !== null) {
	              result1.push(result2);
	              result2 = parse___();
	            }
	          } else {
	            result1 = null;
	          }
	          if (result1 !== null) {
	            result2 = parse_partial();
	            if (result2 !== null) {
	              result1 = [result1, result2];
	            } else {
	              result1 = null;
	              pos = clone(pos3);
	            }
	          } else {
	            result1 = null;
	            pos = clone(pos3);
	          }
	          if (result1 !== null) {
	            result1 = (function(offset, line, column, p) { return p; })(pos2.offset, pos2.line, pos2.column, result1[1]);
	          }
	          if (result1 === null) {
	            pos = clone(pos2);
	          }
	          result1 = result1 !== null ? result1 : "";
	          if (result1 !== null) {
	            result0 = [result0, result1];
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, t, p) { return { textnode: t, partial: p }; })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_textNode() {
	        var result0;
	        var pos0;
	        
	        reportFailures++;
	        pos0 = clone(pos);
	        result0 = parse_quotedText();
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, text) { return helpers.createTextNode(text, line); })(pos0.offset, pos0.line, pos0.column, result0);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        reportFailures--;
	        if (reportFailures === 0 && result0 === null) {
	          matchFailed("text node");
	        }
	        return result0;
	      }
	      
	      function parse_escapedUnicode() {
	        var result0, result1, result2, result3, result4;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 117) {
	          result0 = "u";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"u\"");
	          }
	        }
	        if (result0 !== null) {
	          if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
	            result1 = input.charAt(pos.offset);
	            advance(pos, 1);
	          } else {
	            result1 = null;
	            if (reportFailures === 0) {
	              matchFailed("[0-9a-z]i");
	            }
	          }
	          if (result1 !== null) {
	            if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
	              result2 = input.charAt(pos.offset);
	              advance(pos, 1);
	            } else {
	              result2 = null;
	              if (reportFailures === 0) {
	                matchFailed("[0-9a-z]i");
	              }
	            }
	            if (result2 !== null) {
	              if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
	                result3 = input.charAt(pos.offset);
	                advance(pos, 1);
	              } else {
	                result3 = null;
	                if (reportFailures === 0) {
	                  matchFailed("[0-9a-z]i");
	                }
	              }
	              if (result3 !== null) {
	                if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
	                  result4 = input.charAt(pos.offset);
	                  advance(pos, 1);
	                } else {
	                  result4 = null;
	                  if (reportFailures === 0) {
	                    matchFailed("[0-9a-z]i");
	                  }
	                }
	                if (result4 !== null) {
	                  result0 = [result0, result1, result2, result3, result4];
	                } else {
	                  result0 = null;
	                  pos = clone(pos1);
	                }
	              } else {
	                result0 = null;
	                pos = clone(pos1);
	              }
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, a, b, c, d) { return '' + a + b + c + d; })(pos0.offset, pos0.line, pos0.column, result0[1], result0[2], result0[3], result0[4]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_escapedASCII() {
	        var result0, result1, result2;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 120) {
	          result0 = "x";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"x\"");
	          }
	        }
	        if (result0 !== null) {
	          if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
	            result1 = input.charAt(pos.offset);
	            advance(pos, 1);
	          } else {
	            result1 = null;
	            if (reportFailures === 0) {
	              matchFailed("[0-9a-z]i");
	            }
	          }
	          if (result1 !== null) {
	            if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
	              result2 = input.charAt(pos.offset);
	              advance(pos, 1);
	            } else {
	              result2 = null;
	              if (reportFailures === 0) {
	                matchFailed("[0-9a-z]i");
	              }
	            }
	            if (result2 !== null) {
	              result0 = [result0, result1, result2];
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, a, b) { return '' + a + b; })(pos0.offset, pos0.line, pos0.column, result0[1], result0[2]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_escapedCharacter() {
	        var result0, result1;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 92) {
	          result0 = "\\";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"\\\\\"");
	          }
	        }
	        if (result0 !== null) {
	          result1 = parse_escapedUnicode();
	          if (result1 === null) {
	            result1 = parse_escapedASCII();
	            if (result1 === null) {
	              result1 = parse_character();
	            }
	          }
	          if (result1 !== null) {
	            result0 = [result0, result1];
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, c) { return helpers.escapedCharacter(c); })(pos0.offset, pos0.line, pos0.column, result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_doubleQuotedText() {
	        var result0, result1, result2;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 34) {
	          result0 = "\"";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"\\\"\"");
	          }
	        }
	        if (result0 !== null) {
	          result1 = [];
	          result2 = parse_escapedCharacter();
	          if (result2 === null) {
	            if (/^[^\\\n"]/.test(input.charAt(pos.offset))) {
	              result2 = input.charAt(pos.offset);
	              advance(pos, 1);
	            } else {
	              result2 = null;
	              if (reportFailures === 0) {
	                matchFailed("[^\\\\\\n\"]");
	              }
	            }
	          }
	          while (result2 !== null) {
	            result1.push(result2);
	            result2 = parse_escapedCharacter();
	            if (result2 === null) {
	              if (/^[^\\\n"]/.test(input.charAt(pos.offset))) {
	                result2 = input.charAt(pos.offset);
	                advance(pos, 1);
	              } else {
	                result2 = null;
	                if (reportFailures === 0) {
	                  matchFailed("[^\\\\\\n\"]");
	                }
	              }
	            }
	          }
	          if (result1 !== null) {
	            if (input.charCodeAt(pos.offset) === 34) {
	              result2 = "\"";
	              advance(pos, 1);
	            } else {
	              result2 = null;
	              if (reportFailures === 0) {
	                matchFailed("\"\\\"\"");
	              }
	            }
	            if (result2 !== null) {
	              result0 = [result0, result1, result2];
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, chars) { return chars.join(''); })(pos0.offset, pos0.line, pos0.column, result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_singleQuotedText() {
	        var result0, result1, result2;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 39) {
	          result0 = "'";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"'\"");
	          }
	        }
	        if (result0 !== null) {
	          result1 = [];
	          result2 = parse_escapedCharacter();
	          if (result2 === null) {
	            if (/^[^\\\n']/.test(input.charAt(pos.offset))) {
	              result2 = input.charAt(pos.offset);
	              advance(pos, 1);
	            } else {
	              result2 = null;
	              if (reportFailures === 0) {
	                matchFailed("[^\\\\\\n']");
	              }
	            }
	          }
	          while (result2 !== null) {
	            result1.push(result2);
	            result2 = parse_escapedCharacter();
	            if (result2 === null) {
	              if (/^[^\\\n']/.test(input.charAt(pos.offset))) {
	                result2 = input.charAt(pos.offset);
	                advance(pos, 1);
	              } else {
	                result2 = null;
	                if (reportFailures === 0) {
	                  matchFailed("[^\\\\\\n']");
	                }
	              }
	            }
	          }
	          if (result1 !== null) {
	            if (input.charCodeAt(pos.offset) === 39) {
	              result2 = "'";
	              advance(pos, 1);
	            } else {
	              result2 = null;
	              if (reportFailures === 0) {
	                matchFailed("\"'\"");
	              }
	            }
	            if (result2 !== null) {
	              result0 = [result0, result1, result2];
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, chars) { return chars.join(''); })(pos0.offset, pos0.line, pos0.column, result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_quotedText() {
	        var result0;
	        
	        reportFailures++;
	        result0 = parse_doubleQuotedText();
	        if (result0 === null) {
	          result0 = parse_singleQuotedText();
	        }
	        reportFailures--;
	        if (reportFailures === 0 && result0 === null) {
	          matchFailed("quoted text");
	        }
	        return result0;
	      }
	      
	      function parse_directive() {
	        var result0;
	        
	        reportFailures++;
	        result0 = parse_exprDirective();
	        if (result0 === null) {
	          result0 = parse_simpleDirective();
	        }
	        reportFailures--;
	        if (reportFailures === 0 && result0 === null) {
	          matchFailed("directive");
	        }
	        return result0;
	      }
	      
	      function parse_simpleDirective() {
	        var result0, result1;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 64) {
	          result0 = "@";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"@\"");
	          }
	        }
	        if (result0 !== null) {
	          result1 = parse_identifier();
	          if (result1 !== null) {
	            result0 = [result0, result1];
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, name) { return helpers.createDirective(name, undefined, line); })(pos0.offset, pos0.line, pos0.column, result0[1]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      function parse_exprDirective() {
	        var result0, result1, result2, result3, result4;
	        var pos0, pos1;
	        
	        pos0 = clone(pos);
	        pos1 = clone(pos);
	        if (input.charCodeAt(pos.offset) === 64) {
	          result0 = "@";
	          advance(pos, 1);
	        } else {
	          result0 = null;
	          if (reportFailures === 0) {
	            matchFailed("\"@\"");
	          }
	        }
	        if (result0 !== null) {
	          result1 = parse_identifier();
	          if (result1 !== null) {
	            result3 = parse___();
	            if (result3 !== null) {
	              result2 = [];
	              while (result3 !== null) {
	                result2.push(result3);
	                result3 = parse___();
	              }
	            } else {
	              result2 = null;
	            }
	            if (result2 !== null) {
	              result4 = parse_character();
	              if (result4 !== null) {
	                result3 = [];
	                while (result4 !== null) {
	                  result3.push(result4);
	                  result4 = parse_character();
	                }
	              } else {
	                result3 = null;
	              }
	              if (result3 !== null) {
	                result0 = [result0, result1, result2, result3];
	              } else {
	                result0 = null;
	                pos = clone(pos1);
	              }
	            } else {
	              result0 = null;
	              pos = clone(pos1);
	            }
	          } else {
	            result0 = null;
	            pos = clone(pos1);
	          }
	        } else {
	          result0 = null;
	          pos = clone(pos1);
	        }
	        if (result0 !== null) {
	          result0 = (function(offset, line, column, name, expr) { return helpers.createDirective(name, expr.join(''), line); })(pos0.offset, pos0.line, pos0.column, result0[1], result0[3]);
	        }
	        if (result0 === null) {
	          pos = clone(pos0);
	        }
	        return result0;
	      }
	      
	      
	      function cleanupExpected(expected) {
	        expected.sort();
	        
	        var lastExpected = null;
	        var cleanExpected = [];
	        for (var i = 0; i < expected.length; i++) {
	          if (expected[i] !== lastExpected) {
	            cleanExpected.push(expected[i]);
	            lastExpected = expected[i];
	          }
	        }
	        return cleanExpected;
	      }
	      
	      
	      
	      	var depths = [0];
	      
	      
	      var result = parseFunctions[startRule]();
	      
	      /*
	       * The parser is now in one of the following three states:
	       *
	       * 1. The parser successfully parsed the whole input.
	       *
	       *    - |result !== null|
	       *    - |pos.offset === input.length|
	       *    - |rightmostFailuresExpected| may or may not contain something
	       *
	       * 2. The parser successfully parsed only a part of the input.
	       *
	       *    - |result !== null|
	       *    - |pos.offset < input.length|
	       *    - |rightmostFailuresExpected| may or may not contain something
	       *
	       * 3. The parser did not successfully parse any part of the input.
	       *
	       *   - |result === null|
	       *   - |pos.offset === 0|
	       *   - |rightmostFailuresExpected| contains at least one failure
	       *
	       * All code following this comment (including called functions) must
	       * handle these states.
	       */
	      if (result === null || pos.offset !== input.length) {
	        var offset = Math.max(pos.offset, rightmostFailuresPos.offset);
	        var found = offset < input.length ? input.charAt(offset) : null;
	        var errorPosition = pos.offset > rightmostFailuresPos.offset ? pos : rightmostFailuresPos;
	        
	        throw new this.SyntaxError(
	          cleanupExpected(rightmostFailuresExpected),
	          found,
	          offset,
	          errorPosition.line,
	          errorPosition.column
	        );
	      }
	      
	      return result;
	    },
	    
	    /* Returns the parser source code. */
	    toSource: function() { return this._source; }
	  };
	  
	  /* Thrown when a parser encounters a syntax error. */
	  
	  result.SyntaxError = function(expected, found, offset, line, column) {
	    function buildMessage(expected, found) {
	      var expectedHumanized, foundHumanized;
	      
	      switch (expected.length) {
	        case 0:
	          expectedHumanized = "end of input";
	          break;
	        case 1:
	          expectedHumanized = expected[0];
	          break;
	        default:
	          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
	            + " or "
	            + expected[expected.length - 1];
	      }
	      
	      foundHumanized = found ? quote(found) : "end of input";
	      
	      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
	    }
	    
	    this.name = "SyntaxError";
	    this.expected = expected;
	    this.found = found;
	    this.message = buildMessage(expected, found);
	    this.offset = offset;
	    this.line = line;
	    this.column = column;
	  };
	  
	  result.SyntaxError.prototype = Error.prototype;
	  
	  return result;
	})();
		return pegjsParser;
	}(istComponents.parsehelpers));
	
	istComponents.preprocessor = (function() {
		var newlines = /\r\n|\r|\n/,
			whitespace = /^[ \t]*$/,
			comment = /\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g,
			removeComment, removeWhitespace;
	
		removeComment = function(m, p1) {
			return p1.split(newlines).map(function(l) { return ''; }).join('\n');
		};
	
		removeWhitespace = function(l) {
			return l.match(whitespace) ? "" : l;
		};
	
		/**
		 * Template preprocessor; handle what the parser cannot handle
		 * - Make whitespace-only lines empty
		 * - Remove block-comments (keeping line count)
		 */	
		return function(text) {
			var lines;
	
			// Remove block comments
			text = text.replace(comment, removeComment); 
	
			// Remove everthing from whitespace-only lines
			text = text.split(newlines).map(removeWhitespace).join('\n');
	
			return text;
		};
	}());
	
	/*global define, isBrowser, isNode, ActiveXObject */
	istComponents.amdplugin = ( function(require, misc) {
		
	
		function pluginify(ist) {
			var getXhr, fetchText,
				progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
				buildMap = {};
	
			if (isBrowser) {
				getXhr = function() {
					var xhr, i, progId;
					if (typeof XMLHttpRequest !== 'undefined') {
						return new XMLHttpRequest();
					} else {
						for (i = 0; i < 3; i++) {
							progId = progIds[i];
							try {
								xhr = new ActiveXObject(progId);
							} catch (e) {}
	
							if (xhr) {
								progIds = [progId];  // faster next time
								break;
							}
						}
					}
	
					if (!xhr) {
						throw new Error('getXhr(): XMLHttpRequest not available');
					}
	
					return xhr;
				};
	
				fetchText = function(url, callback) {
					var xhr = getXhr();
					xhr.open('GET', url, true);
					xhr.onreadystatechange = function () {
						//Do not explicitly handle errors, those should be
						//visible via console output in the browser.
						if (xhr.readyState === 4) {
							if (xhr.status !== 200) {
								throw new Error('HTTP status '  + xhr.status + ' when loading ' + url);
							}
		
							callback(xhr.responseText);
						}
					};
					xhr.send(null);
				};
			} else if (isNode) {
				var fs = require.nodeRequire('fs');
	
				fetchText = function(url, callback) {
					var file = fs.readFileSync(url, 'utf8');
					//Remove BOM (Byte Mark Order) from utf8 files if it is there.
					if (file.indexOf('\uFEFF') === 0) {
					    file = file.substring(1);
					}
					callback(file);
				};
			}
	
			ist.write = function (pluginName, name, write) {
				var bmName = 'ist!' + name;
	
				if (buildMap.hasOwnProperty(bmName)) {
					var text = buildMap[bmName];
					write(text);
				}
			};
	
			ist.load = function (name, parentRequire, load, config) {
				var path, dirname, doParse = true;
				
				if (/!bare$/.test(name)) {
					doParse = false;
					name = name.replace(/!bare$/, '');
				}
				
				path = parentRequire.toUrl(name + '.ist');
				dirname = name.indexOf('/') === -1 ? '.' : name.replace(/\/[^\/]*$/, '');
	
				fetchText(path, function (text) {
					var code, deps = ['ist'];
		
					/* Find @include calls and replace them with 'absolute' paths
					   (ie @include 'inc/include' in 'path/to/template'
						 becomes @include 'path/to/inc/include')
					   while recording all distinct include paths
					 */
						 
					text = text.replace(
						/^(\s*)@include\s+(?:text=)?(['"])((?:(?=(\\?))\4.)*?)\2/gm,
						function(m, p1, p2, p3) {
							if (misc.findScript(p3)) {
								// Script tag found, do not change directive
								return m;
							}
							
							var dpath = dirname + '/' + p3.replace(/\.ist$/, '');
			
							if (deps.indexOf('ist!' + dpath) === -1) {
								deps.push('ist!' + dpath);
							}
	
							return p1 + '@include "' + dpath + '"';
						}
					);
					
					if (doParse) {
						/* Get parsed code */
						code = ist(text, name).getCode(true);
						text = 'define(\'ist!' + name + '\',' + JSON.stringify(deps) + ', function(ist) {\n' +
							   '  return ' + code + ';\n' +
							   '});\n';
					} else {
						if (config.isBuild) {
							text = misc.jsEscape(text);
							text = 'define(\'ist!' + name + '\',' + JSON.stringify(deps) + ',function(ist){' +
								   'var template=\'' + text + '\';' +
								   'return ist(template,\'' + name + '\');' +
								   '});';
						} else {
							/* "Pretty-print" template text */
							text = misc.jsEscape(text).replace(/\\n/g, '\\n\' +\n\t               \'');
							text = 'define(\'ist!' + name + '\',' + JSON.stringify(deps) + ', function(ist){ \n' +
								   '\tvar template = \'' + text + '\';\n' +
								   '\treturn ist(template, \'' + name + '\');\n' +
								   '});\n';
						}
					}
						   
					//Hold on to the transformed text if a build.
					if (config.isBuild) {
						buildMap['ist!' + name] = text;
					}
	
					//IE with conditional comments on cannot handle the
					//sourceURL trick, so skip it if enabled.
					/*@if (@_jscript) @else @*/
					if (!config.isBuild) {
						text += '\r\n//@ sourceURL=' + path;
					}
					/*@end@*/
		
					load.fromText('ist!' + name, text);
	
					// Finish loading and give result to load()
					parentRequire(['ist!' + name], function (value) {
						load(value);
					});
				});
			};
		}
		
		return pluginify;
	}(istComponents.require, istComponents.misc));
	
	/*global define, requirejs, isAMD, isNode, isBrowser */
	istComponents.ist = ( function(Template, directives, pegjsParser, preprocess, pluginify, misc) {
		
	
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
		ist.helper('include', function(ctx, value, tmpl, fragment) {
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
				fragment.appendChild(found.render(ctx));
			} else {
				throw new Error('Invalid included template \'' + name + '\'');
			}
		});
		
	
		if (isNode || (isBrowser && isAMD)) {
			pluginify(ist);
		}
		
		return ist;
	}(
		istComponents.template,
		istComponents.directives,
		istComponents.parser,
		istComponents.preprocessor,
		istComponents.amdplugin,
		istComponents.misc
	));
		
	if (isAMD) {
		global.define("ist", [], function() { return istComponents.ist; });
	} else {
		previous = global.ist;
		
		global.ist = istComponents.ist;
		global.ist.noConflict = function() {
			var ist = global.ist;
			global.ist = previous;
			return ist;
		};
		
	}
}(this)); 
