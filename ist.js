/**
 * IST: Indented Selector Templating
 * version 0.6.6
 *
 * Copyright (c) 2012-2014 Nicolas Joyard
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
	
				properties.forEach(function(prop) {
					var itcode = [];
	
					for (var i = 0, len = prop.path.length; i < len; i++) {
						var pathElement = prop.path[i];
						if (i === len - 1) {
							itcode.push(
								'current["' + pathElement + '"] = value;'
							);
						} else {
							itcode.push(
								'if (!("' + pathElement + '" in current)) {' +
									'current["' + pathElement + '"] = {};' +
								'}' +
								'current = current["' + pathElement + '"];'
							);
						}
					}
	
					code.push(
						'(function(value) {' +
							'var current = element;' +
							itcode.join('') +
						'})((' + codegen.interpolation(prop.value) + ').call(this,document,_istScope));'
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
					'textNode.textContent=""+(' + this.interpolation(node.text) + ').call(this,document,_istScope);'
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
			this.rootScope = this.scope = Context.globalScope;
		}
	
	
		Context.globalScope = {};
	
	
		Context.prototype = {
			/* Node creation aliases */
			importNode: function(node, deep) {
				if (node.ownerDocument === this.doc) {
					return node.cloneNode(deep);
				} else {
					return this.doc.importNode(node, deep);
				}
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
	
			createComment: function(comment) {
				return this.doc.createComment(comment);
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
					value = ctx.doc.importNode(value, true);
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
	
			if (fragment.firstChild && fragment.firstChild._isISTPlaceHolder) {
				fragment.removeChild(fragment.firstChild);
			}
		
			try {
				helper.call(null, ctx, ctx.scopedCall(pr.evaluator), pr.template, fragment);
			} catch (err) {
				throw this._completeError(err, node);
			}
	
			if (fragment.childNodes.length === 0) {
				var placeholder = ctx.createComment('');
	
				placeholder._isISTPlaceHolder = true;
				fragment.appendChild(placeholder);
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
	}(
		istComponents.context,
		istComponents.directives,
		istComponents.renderedtree,
		istComponents.rendereddirective
	));
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
	
			if (typeof document !== 'undefined')
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
			')';
		};
		
		
		return Template;
	}(
		istComponents.codegen,
		istComponents.context,
		istComponents.renderer
	));
	
	/*global define */
	istComponents.parsehelpers = (function() {
		
	
		var UNCHANGED = "U", INDENT = "I", DEDENT = "D",
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
			
			if (typeof this.id !== "undefined") {
				o.id = this.id;
			}
		
			if (typeof this.partial !== "undefined") {
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
	
			popNode = function() {
				var node, parent, err;
	
				if (stack.length < 2) {
					throw new Error("Could not pop node from stack");
				}
		
				node = stack.pop();
				parent = peekNode();
	
				if (typeof parent.text !== "undefined") {
					err = new Error("Cannot add children to text node");
					err.line = node.line;
					throw err;
				}
	
				if (node.directive === "else") {
					var prev = parent.children[parent.children.length - 1];
	
					if (prev && !prev.wasElse && prev.directive === "if") {
						node.directive = "unless";
					} else if (prev && !prev.wasElse && prev.directive === "unless") {
						node.directive = "if";
					} else {
						err = new Error("@else directive has no matching @if or @unless directive");
						err.line = node.line;
						throw err;
					}
	
					node.expr = prev.expr;
					node.wasElse = true;
				}
	
				parent.children.push(node);
			
				return node;
			};
		
			// Remove newlines
			lines = tail.map(function(item) { return item.pop(); });
			lines.unshift(first);
	
			lines.forEach(function(line) {
				var indent = line.indent,
					item = line.item;
				
				if (indent[0] instanceof Error) {
					throw indent[0];
				}
			
				if (nodeCount > 0) {
					if (indent[0] === UNCHANGED) {
						// Same indent: previous node won"t have any children
						popNode();
					} else if (indent[0] === DEDENT) {
						// Pop nodes in their parent
						popNode();
				
						while (indent.length > 0) {
							indent.pop();
							popNode();
						}
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
				properties: [],
				events: {},
				children: [],
				toJSON: elemToJSON
			};
	
			qualifiers.forEach(function(q) {
				if (typeof q.id !== "undefined") {
					elem.id = q.id;
				} else if (typeof q.className !== "undefined") {
					elem.classes.push(q.className);
				} else if (typeof q.attr !== "undefined") {
					elem.attributes[q.attr] = q.value;
				} else if (typeof q.prop !== "undefined") {
					elem.properties.push({ path: q.prop, value: q.value });
				} else if (typeof q.event !== "undefined") {
					if (typeof elem.events[q.event] === "undefined") {
						elem.events[q.event] = [];
					}
				
					elem.events[q.event].push(q.value);
				}
			});
		
			if (typeof additions !== "undefined") {
				if (additions.partial) {
					elem.partial = additions.partial;
				}
			
				if (additions.textnode &&
					typeof additions.textnode.text !== "undefined") {
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
				return { "f": "\f", "b": "\b", "t": "\t", "n": "\n", "r": "\r" }[char] || char;
			}
		};
		
		return helpers;
	}());
	
	istComponents.parser = ( function(helpers) {
		var pegjsParser;
	pegjsParser = (function() {
	  /*
	   * Generated by PEG.js 0.8.0.
	   *
	   * http://pegjs.majda.cz/
	   */
	
	  function peg$subclass(child, parent) {
	    function ctor() { this.constructor = child; }
	    ctor.prototype = parent.prototype;
	    child.prototype = new ctor();
	  }
	
	  function SyntaxError(message, expected, found, offset, line, column) {
	    this.message  = message;
	    this.expected = expected;
	    this.found    = found;
	    this.offset   = offset;
	    this.line     = line;
	    this.column   = column;
	
	    this.name     = "SyntaxError";
	  }
	
	  peg$subclass(SyntaxError, Error);
	
	  function parse(input) {
	    var options = arguments.length > 1 ? arguments[1] : {},
	
	        peg$FAILED = {},
	
	        peg$startRuleFunctions = { templateLines: peg$parsetemplateLines },
	        peg$startRuleFunction  = peg$parsetemplateLines,
	
	        peg$c0 = peg$FAILED,
	        peg$c1 = [],
	        peg$c2 = null,
	        peg$c3 = function(first, tail) { return helpers.generateNodeTree(first, tail); },
	        peg$c4 = { type: "other", description: "whitespace" },
	        peg$c5 = /^[ \t]/,
	        peg$c6 = { type: "class", value: "[ \\t]", description: "[ \\t]" },
	        peg$c7 = function(depth, s) { return { indent: depth, item: s }; },
	        peg$c8 = { type: "other", description: "indent" },
	        peg$c9 = function(s) { return helpers.parseIndent(depths, s, line()); },
	        peg$c10 = { type: "other", description: "new line" },
	        peg$c11 = "\n",
	        peg$c12 = { type: "literal", value: "\n", description: "\"\\n\"" },
	        peg$c13 = { type: "other", description: "character" },
	        peg$c14 = /^[^\n]/,
	        peg$c15 = { type: "class", value: "[^\\n]", description: "[^\\n]" },
	        peg$c16 = { type: "other", description: "identifier" },
	        peg$c17 = /^[a-z_]/i,
	        peg$c18 = { type: "class", value: "[a-z_]i", description: "[a-z_]i" },
	        peg$c19 = /^[a-z0-9_\-]/i,
	        peg$c20 = { type: "class", value: "[a-z0-9_\\-]i", description: "[a-z0-9_\\-]i" },
	        peg$c21 = function(h, t) { return h + t.join(''); },
	        peg$c22 = { type: "other", description: "dotted path" },
	        peg$c23 = ".",
	        peg$c24 = { type: "literal", value: ".", description: "\".\"" },
	        peg$c25 = function(h, t) { return t.length ? [h].concat(t.map(function(i) { return i[1]; })) : [h] },
	        peg$c26 = "!",
	        peg$c27 = { type: "literal", value: "!", description: "\"!\"" },
	        peg$c28 = function(name) { return name; },
	        peg$c29 = "#",
	        peg$c30 = { type: "literal", value: "#", description: "\"#\"" },
	        peg$c31 = function(id) { return { 'id': id }; },
	        peg$c32 = function(cls) { return { 'className': cls }; },
	        peg$c33 = /^[^\\\n\]]/,
	        peg$c34 = { type: "class", value: "[^\\\\\\n\\]]", description: "[^\\\\\\n\\]]" },
	        peg$c35 = function(chars) { return chars.join(''); },
	        peg$c36 = "[",
	        peg$c37 = { type: "literal", value: "[", description: "\"[\"" },
	        peg$c38 = "=",
	        peg$c39 = { type: "literal", value: "=", description: "\"=\"" },
	        peg$c40 = "]",
	        peg$c41 = { type: "literal", value: "]", description: "\"]\"" },
	        peg$c42 = function(attr, value) { return { 'attr': attr, 'value': value }; },
	        peg$c43 = function(prop, value) { return { 'prop': prop, 'value': value }; },
	        peg$c44 = function(event, value) { return { 'event': event, 'value': value }; },
	        peg$c45 = { type: "other", description: "element qualifier" },
	        peg$c46 = { type: "other", description: "element" },
	        peg$c47 = function(qualifiers, additions) { return helpers.createElement('div', qualifiers, additions, line()); },
	        peg$c48 = function(tagName, qualifiers, additions) { return helpers.createElement(tagName, qualifiers, additions, line()); },
	        peg$c49 = function(t) { return t; },
	        peg$c50 = function(p) { return p; },
	        peg$c51 = function(t, p) { return { textnode: t, partial: p }; },
	        peg$c52 = { type: "other", description: "text node" },
	        peg$c53 = function(text) { return helpers.createTextNode(text, line()); },
	        peg$c54 = "u",
	        peg$c55 = { type: "literal", value: "u", description: "\"u\"" },
	        peg$c56 = /^[0-9a-z]/i,
	        peg$c57 = { type: "class", value: "[0-9a-z]i", description: "[0-9a-z]i" },
	        peg$c58 = function(a, b, c, d) { return '' + a + b + c + d; },
	        peg$c59 = "x",
	        peg$c60 = { type: "literal", value: "x", description: "\"x\"" },
	        peg$c61 = function(a, b) { return '' + a + b; },
	        peg$c62 = "\\",
	        peg$c63 = { type: "literal", value: "\\", description: "\"\\\\\"" },
	        peg$c64 = function(c) { return helpers.escapedCharacter(c); },
	        peg$c65 = "\"",
	        peg$c66 = { type: "literal", value: "\"", description: "\"\\\"\"" },
	        peg$c67 = /^[^\\\n"]/,
	        peg$c68 = { type: "class", value: "[^\\\\\\n\"]", description: "[^\\\\\\n\"]" },
	        peg$c69 = "'",
	        peg$c70 = { type: "literal", value: "'", description: "\"'\"" },
	        peg$c71 = /^[^\\\n']/,
	        peg$c72 = { type: "class", value: "[^\\\\\\n']", description: "[^\\\\\\n']" },
	        peg$c73 = { type: "other", description: "quoted text" },
	        peg$c74 = { type: "other", description: "directive" },
	        peg$c75 = "@",
	        peg$c76 = { type: "literal", value: "@", description: "\"@\"" },
	        peg$c77 = function(name) { return helpers.createDirective(name, undefined, line()); },
	        peg$c78 = function(name, expr) { return helpers.createDirective(name, expr.join(''), line()); },
	
	        peg$currPos          = 0,
	        peg$reportedPos      = 0,
	        peg$cachedPos        = 0,
	        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
	        peg$maxFailPos       = 0,
	        peg$maxFailExpected  = [],
	        peg$silentFails      = 0,
	
	        peg$result;
	
	    if ("startRule" in options) {
	      if (!(options.startRule in peg$startRuleFunctions)) {
	        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
	      }
	
	      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
	    }
	
	    function text() {
	      return input.substring(peg$reportedPos, peg$currPos);
	    }
	
	    function offset() {
	      return peg$reportedPos;
	    }
	
	    function line() {
	      return peg$computePosDetails(peg$reportedPos).line;
	    }
	
	    function column() {
	      return peg$computePosDetails(peg$reportedPos).column;
	    }
	
	    function expected(description) {
	      throw peg$buildException(
	        null,
	        [{ type: "other", description: description }],
	        peg$reportedPos
	      );
	    }
	
	    function error(message) {
	      throw peg$buildException(message, null, peg$reportedPos);
	    }
	
	    function peg$computePosDetails(pos) {
	      function advance(details, startPos, endPos) {
	        var p, ch;
	
	        for (p = startPos; p < endPos; p++) {
	          ch = input.charAt(p);
	          if (ch === "\n") {
	            if (!details.seenCR) { details.line++; }
	            details.column = 1;
	            details.seenCR = false;
	          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
	            details.line++;
	            details.column = 1;
	            details.seenCR = true;
	          } else {
	            details.column++;
	            details.seenCR = false;
	          }
	        }
	      }
	
	      if (peg$cachedPos !== pos) {
	        if (peg$cachedPos > pos) {
	          peg$cachedPos = 0;
	          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
	        }
	        advance(peg$cachedPosDetails, peg$cachedPos, pos);
	        peg$cachedPos = pos;
	      }
	
	      return peg$cachedPosDetails;
	    }
	
	    function peg$fail(expected) {
	      if (peg$currPos < peg$maxFailPos) { return; }
	
	      if (peg$currPos > peg$maxFailPos) {
	        peg$maxFailPos = peg$currPos;
	        peg$maxFailExpected = [];
	      }
	
	      peg$maxFailExpected.push(expected);
	    }
	
	    function peg$buildException(message, expected, pos) {
	      function cleanupExpected(expected) {
	        var i = 1;
	
	        expected.sort(function(a, b) {
	          if (a.description < b.description) {
	            return -1;
	          } else if (a.description > b.description) {
	            return 1;
	          } else {
	            return 0;
	          }
	        });
	
	        while (i < expected.length) {
	          if (expected[i - 1] === expected[i]) {
	            expected.splice(i, 1);
	          } else {
	            i++;
	          }
	        }
	      }
	
	      function buildMessage(expected, found) {
	        function stringEscape(s) {
	          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }
	
	          return s
	            .replace(/\\/g,   '\\\\')
	            .replace(/"/g,    '\\"')
	            .replace(/\x08/g, '\\b')
	            .replace(/\t/g,   '\\t')
	            .replace(/\n/g,   '\\n')
	            .replace(/\f/g,   '\\f')
	            .replace(/\r/g,   '\\r')
	            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
	            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
	            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
	            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
	        }
	
	        var expectedDescs = new Array(expected.length),
	            expectedDesc, foundDesc, i;
	
	        for (i = 0; i < expected.length; i++) {
	          expectedDescs[i] = expected[i].description;
	        }
	
	        expectedDesc = expected.length > 1
	          ? expectedDescs.slice(0, -1).join(", ")
	              + " or "
	              + expectedDescs[expected.length - 1]
	          : expectedDescs[0];
	
	        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";
	
	        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
	      }
	
	      var posDetails = peg$computePosDetails(pos),
	          found      = pos < input.length ? input.charAt(pos) : null;
	
	      if (expected !== null) {
	        cleanupExpected(expected);
	      }
	
	      return new SyntaxError(
	        message !== null ? message : buildMessage(expected, found),
	        expected,
	        found,
	        pos,
	        posDetails.line,
	        posDetails.column
	      );
	    }
	
	    function peg$parsetemplateLines() {
	      var s0, s1, s2, s3, s4, s5, s6;
	
	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parsenewline();
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parsenewline();
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseline();
	        if (s2 === peg$FAILED) {
	          s2 = peg$c2;
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$currPos;
	          s5 = [];
	          s6 = peg$parsenewline();
	          if (s6 !== peg$FAILED) {
	            while (s6 !== peg$FAILED) {
	              s5.push(s6);
	              s6 = peg$parsenewline();
	            }
	          } else {
	            s5 = peg$c0;
	          }
	          if (s5 !== peg$FAILED) {
	            s6 = peg$parseline();
	            if (s6 !== peg$FAILED) {
	              s5 = [s5, s6];
	              s4 = s5;
	            } else {
	              peg$currPos = s4;
	              s4 = peg$c0;
	            }
	          } else {
	            peg$currPos = s4;
	            s4 = peg$c0;
	          }
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$currPos;
	            s5 = [];
	            s6 = peg$parsenewline();
	            if (s6 !== peg$FAILED) {
	              while (s6 !== peg$FAILED) {
	                s5.push(s6);
	                s6 = peg$parsenewline();
	              }
	            } else {
	              s5 = peg$c0;
	            }
	            if (s5 !== peg$FAILED) {
	              s6 = peg$parseline();
	              if (s6 !== peg$FAILED) {
	                s5 = [s5, s6];
	                s4 = s5;
	              } else {
	                peg$currPos = s4;
	                s4 = peg$c0;
	              }
	            } else {
	              peg$currPos = s4;
	              s4 = peg$c0;
	            }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = [];
	            s5 = peg$parsenewline();
	            while (s5 !== peg$FAILED) {
	              s4.push(s5);
	              s5 = peg$parsenewline();
	            }
	            if (s4 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c3(s2, s3);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c0;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parse__() {
	      var s0, s1;
	
	      peg$silentFails++;
	      if (peg$c5.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c6); }
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c4); }
	      }
	
	      return s0;
	    }
	
	    function peg$parseline() {
	      var s0, s1, s2, s3, s4;
	
	      s0 = peg$currPos;
	      s1 = peg$parseindent();
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseelement();
	        if (s2 === peg$FAILED) {
	          s2 = peg$parsetextNode();
	          if (s2 === peg$FAILED) {
	            s2 = peg$parsedirective();
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parse__();
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parse__();
	          }
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c7(s1, s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseindent() {
	      var s0, s1, s2;
	
	      peg$silentFails++;
	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parse__();
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parse__();
	      }
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c9(s1);
	      }
	      s0 = s1;
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c8); }
	      }
	
	      return s0;
	    }
	
	    function peg$parsenewline() {
	      var s0, s1;
	
	      peg$silentFails++;
	      if (input.charCodeAt(peg$currPos) === 10) {
	        s0 = peg$c11;
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c12); }
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c10); }
	      }
	
	      return s0;
	    }
	
	    function peg$parsecharacter() {
	      var s0, s1;
	
	      peg$silentFails++;
	      if (peg$c14.test(input.charAt(peg$currPos))) {
	        s0 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s0 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c15); }
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c13); }
	      }
	
	      return s0;
	    }
	
	    function peg$parseidentifier() {
	      var s0, s1, s2, s3;
	
	      peg$silentFails++;
	      s0 = peg$currPos;
	      if (peg$c17.test(input.charAt(peg$currPos))) {
	        s1 = input.charAt(peg$currPos);
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c18); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        if (peg$c19.test(input.charAt(peg$currPos))) {
	          s3 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s3 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c20); }
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          if (peg$c19.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c20); }
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c21(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c16); }
	      }
	
	      return s0;
	    }
	
	    function peg$parsedottedpath() {
	      var s0, s1, s2, s3, s4, s5;
	
	      peg$silentFails++;
	      s0 = peg$currPos;
	      s1 = peg$parseidentifier();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$currPos;
	        if (input.charCodeAt(peg$currPos) === 46) {
	          s4 = peg$c23;
	          peg$currPos++;
	        } else {
	          s4 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c24); }
	        }
	        if (s4 !== peg$FAILED) {
	          s5 = peg$parseidentifier();
	          if (s5 !== peg$FAILED) {
	            s4 = [s4, s5];
	            s3 = s4;
	          } else {
	            peg$currPos = s3;
	            s3 = peg$c0;
	          }
	        } else {
	          peg$currPos = s3;
	          s3 = peg$c0;
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$currPos;
	          if (input.charCodeAt(peg$currPos) === 46) {
	            s4 = peg$c23;
	            peg$currPos++;
	          } else {
	            s4 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c24); }
	          }
	          if (s4 !== peg$FAILED) {
	            s5 = peg$parseidentifier();
	            if (s5 !== peg$FAILED) {
	              s4 = [s4, s5];
	              s3 = s4;
	            } else {
	              peg$currPos = s3;
	              s3 = peg$c0;
	            }
	          } else {
	            peg$currPos = s3;
	            s3 = peg$c0;
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c25(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c22); }
	      }
	
	      return s0;
	    }
	
	    function peg$parsepartial() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 33) {
	        s1 = peg$c26;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c27); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseidentifier();
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c28(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseelemId() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 35) {
	        s1 = peg$c29;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c30); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseidentifier();
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c31(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseelemClass() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 46) {
	        s1 = peg$c23;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c24); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseidentifier();
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c32(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parsesquareBracketsValue() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parseescapedCharacter();
	      if (s2 === peg$FAILED) {
	        if (peg$c33.test(input.charAt(peg$currPos))) {
	          s2 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c34); }
	        }
	      }
	      while (s2 !== peg$FAILED) {
	        s1.push(s2);
	        s2 = peg$parseescapedCharacter();
	        if (s2 === peg$FAILED) {
	          if (peg$c33.test(input.charAt(peg$currPos))) {
	            s2 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s2 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c34); }
	          }
	        }
	      }
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c35(s1);
	      }
	      s0 = s1;
	
	      return s0;
	    }
	
	    function peg$parseelemAttribute() {
	      var s0, s1, s2, s3, s4, s5;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s1 = peg$c36;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c37); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseidentifier();
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 61) {
	            s3 = peg$c38;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c39); }
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = peg$parsesquareBracketsValue();
	            if (s4 !== peg$FAILED) {
	              if (input.charCodeAt(peg$currPos) === 93) {
	                s5 = peg$c40;
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c41); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$reportedPos = s0;
	                s1 = peg$c42(s2, s4);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$c0;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c0;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseelemProperty() {
	      var s0, s1, s2, s3, s4, s5, s6;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s1 = peg$c36;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c37); }
	      }
	      if (s1 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 46) {
	          s2 = peg$c23;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c24); }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parsedottedpath();
	          if (s3 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 61) {
	              s4 = peg$c38;
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c39); }
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parsesquareBracketsValue();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 93) {
	                  s6 = peg$c40;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c41); }
	                }
	                if (s6 !== peg$FAILED) {
	                  peg$reportedPos = s0;
	                  s1 = peg$c43(s3, s5);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$c0;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$c0;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c0;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseelemEventHandler() {
	      var s0, s1, s2, s3, s4, s5, s6;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 91) {
	        s1 = peg$c36;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c37); }
	      }
	      if (s1 !== peg$FAILED) {
	        if (input.charCodeAt(peg$currPos) === 33) {
	          s2 = peg$c26;
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c27); }
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseidentifier();
	          if (s3 !== peg$FAILED) {
	            if (input.charCodeAt(peg$currPos) === 61) {
	              s4 = peg$c38;
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c39); }
	            }
	            if (s4 !== peg$FAILED) {
	              s5 = peg$parsesquareBracketsValue();
	              if (s5 !== peg$FAILED) {
	                if (input.charCodeAt(peg$currPos) === 93) {
	                  s6 = peg$c40;
	                  peg$currPos++;
	                } else {
	                  s6 = peg$FAILED;
	                  if (peg$silentFails === 0) { peg$fail(peg$c41); }
	                }
	                if (s6 !== peg$FAILED) {
	                  peg$reportedPos = s0;
	                  s1 = peg$c44(s3, s5);
	                  s0 = s1;
	                } else {
	                  peg$currPos = s0;
	                  s0 = peg$c0;
	                }
	              } else {
	                peg$currPos = s0;
	                s0 = peg$c0;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c0;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseelemQualifier() {
	      var s0, s1;
	
	      peg$silentFails++;
	      s0 = peg$parseelemId();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseelemClass();
	        if (s0 === peg$FAILED) {
	          s0 = peg$parseelemAttribute();
	          if (s0 === peg$FAILED) {
	            s0 = peg$parseelemProperty();
	            if (s0 === peg$FAILED) {
	              s0 = peg$parseelemEventHandler();
	            }
	          }
	        }
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c45); }
	      }
	
	      return s0;
	    }
	
	    function peg$parseelement() {
	      var s0, s1;
	
	      peg$silentFails++;
	      s0 = peg$parseimplicitElement();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parseexplicitElement();
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c46); }
	      }
	
	      return s0;
	    }
	
	    function peg$parseimplicitElement() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      s1 = [];
	      s2 = peg$parseelemQualifier();
	      if (s2 !== peg$FAILED) {
	        while (s2 !== peg$FAILED) {
	          s1.push(s2);
	          s2 = peg$parseelemQualifier();
	        }
	      } else {
	        s1 = peg$c0;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseelementAdditions();
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c47(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseexplicitElement() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      s1 = peg$parseidentifier();
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$parseelemQualifier();
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$parseelemQualifier();
	        }
	        if (s2 !== peg$FAILED) {
	          s3 = peg$parseelementAdditions();
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c48(s1, s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseelementAdditions() {
	      var s0, s1, s2, s3, s4;
	
	      s0 = peg$currPos;
	      s1 = peg$currPos;
	      s2 = [];
	      s3 = peg$parse__();
	      if (s3 !== peg$FAILED) {
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$parse__();
	        }
	      } else {
	        s2 = peg$c0;
	      }
	      if (s2 !== peg$FAILED) {
	        s3 = peg$parsetextNode();
	        if (s3 !== peg$FAILED) {
	          peg$reportedPos = s1;
	          s2 = peg$c49(s3);
	          s1 = s2;
	        } else {
	          peg$currPos = s1;
	          s1 = peg$c0;
	        }
	      } else {
	        peg$currPos = s1;
	        s1 = peg$c0;
	      }
	      if (s1 === peg$FAILED) {
	        s1 = peg$c2;
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$currPos;
	        s3 = [];
	        s4 = peg$parse__();
	        if (s4 !== peg$FAILED) {
	          while (s4 !== peg$FAILED) {
	            s3.push(s4);
	            s4 = peg$parse__();
	          }
	        } else {
	          s3 = peg$c0;
	        }
	        if (s3 !== peg$FAILED) {
	          s4 = peg$parsepartial();
	          if (s4 !== peg$FAILED) {
	            peg$reportedPos = s2;
	            s3 = peg$c50(s4);
	            s2 = s3;
	          } else {
	            peg$currPos = s2;
	            s2 = peg$c0;
	          }
	        } else {
	          peg$currPos = s2;
	          s2 = peg$c0;
	        }
	        if (s2 === peg$FAILED) {
	          s2 = peg$c2;
	        }
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c51(s1, s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parsetextNode() {
	      var s0, s1;
	
	      peg$silentFails++;
	      s0 = peg$currPos;
	      s1 = peg$parsequotedText();
	      if (s1 !== peg$FAILED) {
	        peg$reportedPos = s0;
	        s1 = peg$c53(s1);
	      }
	      s0 = s1;
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c52); }
	      }
	
	      return s0;
	    }
	
	    function peg$parseescapedUnicode() {
	      var s0, s1, s2, s3, s4, s5;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 117) {
	        s1 = peg$c54;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c55); }
	      }
	      if (s1 !== peg$FAILED) {
	        if (peg$c56.test(input.charAt(peg$currPos))) {
	          s2 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c57); }
	        }
	        if (s2 !== peg$FAILED) {
	          if (peg$c56.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c57); }
	          }
	          if (s3 !== peg$FAILED) {
	            if (peg$c56.test(input.charAt(peg$currPos))) {
	              s4 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s4 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c57); }
	            }
	            if (s4 !== peg$FAILED) {
	              if (peg$c56.test(input.charAt(peg$currPos))) {
	                s5 = input.charAt(peg$currPos);
	                peg$currPos++;
	              } else {
	                s5 = peg$FAILED;
	                if (peg$silentFails === 0) { peg$fail(peg$c57); }
	              }
	              if (s5 !== peg$FAILED) {
	                peg$reportedPos = s0;
	                s1 = peg$c58(s2, s3, s4, s5);
	                s0 = s1;
	              } else {
	                peg$currPos = s0;
	                s0 = peg$c0;
	              }
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c0;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseescapedASCII() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 120) {
	        s1 = peg$c59;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c60); }
	      }
	      if (s1 !== peg$FAILED) {
	        if (peg$c56.test(input.charAt(peg$currPos))) {
	          s2 = input.charAt(peg$currPos);
	          peg$currPos++;
	        } else {
	          s2 = peg$FAILED;
	          if (peg$silentFails === 0) { peg$fail(peg$c57); }
	        }
	        if (s2 !== peg$FAILED) {
	          if (peg$c56.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c57); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c61(s2, s3);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseescapedCharacter() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 92) {
	        s1 = peg$c62;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c63); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseescapedUnicode();
	        if (s2 === peg$FAILED) {
	          s2 = peg$parseescapedASCII();
	          if (s2 === peg$FAILED) {
	            s2 = peg$parsecharacter();
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c64(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parsedoubleQuotedText() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 34) {
	        s1 = peg$c65;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c66); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$parseescapedCharacter();
	        if (s3 === peg$FAILED) {
	          if (peg$c67.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c68); }
	          }
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$parseescapedCharacter();
	          if (s3 === peg$FAILED) {
	            if (peg$c67.test(input.charAt(peg$currPos))) {
	              s3 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c68); }
	            }
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 34) {
	            s3 = peg$c65;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c66); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c35(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parsesingleQuotedText() {
	      var s0, s1, s2, s3;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 39) {
	        s1 = peg$c69;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c70); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = [];
	        s3 = peg$parseescapedCharacter();
	        if (s3 === peg$FAILED) {
	          if (peg$c71.test(input.charAt(peg$currPos))) {
	            s3 = input.charAt(peg$currPos);
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c72); }
	          }
	        }
	        while (s3 !== peg$FAILED) {
	          s2.push(s3);
	          s3 = peg$parseescapedCharacter();
	          if (s3 === peg$FAILED) {
	            if (peg$c71.test(input.charAt(peg$currPos))) {
	              s3 = input.charAt(peg$currPos);
	              peg$currPos++;
	            } else {
	              s3 = peg$FAILED;
	              if (peg$silentFails === 0) { peg$fail(peg$c72); }
	            }
	          }
	        }
	        if (s2 !== peg$FAILED) {
	          if (input.charCodeAt(peg$currPos) === 39) {
	            s3 = peg$c69;
	            peg$currPos++;
	          } else {
	            s3 = peg$FAILED;
	            if (peg$silentFails === 0) { peg$fail(peg$c70); }
	          }
	          if (s3 !== peg$FAILED) {
	            peg$reportedPos = s0;
	            s1 = peg$c35(s2);
	            s0 = s1;
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parsequotedText() {
	      var s0, s1;
	
	      peg$silentFails++;
	      s0 = peg$parsedoubleQuotedText();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parsesingleQuotedText();
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c73); }
	      }
	
	      return s0;
	    }
	
	    function peg$parsedirective() {
	      var s0, s1;
	
	      peg$silentFails++;
	      s0 = peg$parseexprDirective();
	      if (s0 === peg$FAILED) {
	        s0 = peg$parsesimpleDirective();
	      }
	      peg$silentFails--;
	      if (s0 === peg$FAILED) {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c74); }
	      }
	
	      return s0;
	    }
	
	    function peg$parsesimpleDirective() {
	      var s0, s1, s2;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 64) {
	        s1 = peg$c75;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c76); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseidentifier();
	        if (s2 !== peg$FAILED) {
	          peg$reportedPos = s0;
	          s1 = peg$c77(s2);
	          s0 = s1;
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	    function peg$parseexprDirective() {
	      var s0, s1, s2, s3, s4, s5;
	
	      s0 = peg$currPos;
	      if (input.charCodeAt(peg$currPos) === 64) {
	        s1 = peg$c75;
	        peg$currPos++;
	      } else {
	        s1 = peg$FAILED;
	        if (peg$silentFails === 0) { peg$fail(peg$c76); }
	      }
	      if (s1 !== peg$FAILED) {
	        s2 = peg$parseidentifier();
	        if (s2 !== peg$FAILED) {
	          s3 = [];
	          s4 = peg$parse__();
	          if (s4 !== peg$FAILED) {
	            while (s4 !== peg$FAILED) {
	              s3.push(s4);
	              s4 = peg$parse__();
	            }
	          } else {
	            s3 = peg$c0;
	          }
	          if (s3 !== peg$FAILED) {
	            s4 = [];
	            s5 = peg$parsecharacter();
	            if (s5 !== peg$FAILED) {
	              while (s5 !== peg$FAILED) {
	                s4.push(s5);
	                s5 = peg$parsecharacter();
	              }
	            } else {
	              s4 = peg$c0;
	            }
	            if (s4 !== peg$FAILED) {
	              peg$reportedPos = s0;
	              s1 = peg$c78(s2, s4);
	              s0 = s1;
	            } else {
	              peg$currPos = s0;
	              s0 = peg$c0;
	            }
	          } else {
	            peg$currPos = s0;
	            s0 = peg$c0;
	          }
	        } else {
	          peg$currPos = s0;
	          s0 = peg$c0;
	        }
	      } else {
	        peg$currPos = s0;
	        s0 = peg$c0;
	      }
	
	      return s0;
	    }
	
	
	    	var depths = [0];
	
	
	    peg$result = peg$startRuleFunction();
	
	    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
	      return peg$result;
	    } else {
	      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
	        peg$fail({ type: "end", description: "end of input" });
	      }
	
	      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
	    }
	  }
	
	  return {
	    SyntaxError: SyntaxError,
	    parse:       parse
	  };
	})();
		return pegjsParser;
	}(istComponents.parsehelpers));
	
	istComponents.preprocessor = (function() {
		var newlines = /\r\n|\r|\n/,
			whitespace = /^[ \t]*$/,
			comment = /\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g,
			removeComment, removeWhitespace;
	
		removeComment = function(m, p1) {
			return p1.split(newlines).map(function() { return ""; }).join("\n");
		};
	
		removeWhitespace = function(l) {
			return l.match(whitespace) ? "" : l;
		};
	
		/**
		 * Template preprocessor; handle what the parser cannot handle
		 * - Make whitespace-only lines empty
		 * - Remove block-comments (keeping line count)
		 * - Remove escaped line breaks
		 */
		return function(text) {
			return text
				// Remove block comments
				.replace(comment, removeComment)
	
				.split(newlines)
	
				// Remove everthing from whitespace-only lines
				.map(removeWhitespace)
	
				// Remove escaped line breaks
				.reduce(function(lines, line) {
					if (lines.length) {
						var prevline = lines[lines.length - 1];
						if (prevline[prevline.length - 1] === "\\") {
							lines[lines.length - 1] = prevline.replace(/\s*\\$/, "") + line.replace(/^\s*/, "");
						} else {
							lines.push(line);
						}
					} else {
						lines.push(line);
					}
	
					return lines;
				}, [])
	
				.join("\n");
		};
	}());
	
	/*global define, require, isBrowser, isNode */
	istComponents.amdplugin = ( function(misc) {
		
	
		function pluginify(ist) {
			var fetchText, buildMap = {};
	
			if (isBrowser) {
				fetchText = function(url, callback) {
					var xhr = new XMLHttpRequest();
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
				var path, dirname;
				
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
					
					/* Get parsed code */
					code = ist(text, name).getCode(true);
					text = 'define(\'ist!' + name + '\',' + JSON.stringify(deps) + ', function(ist) {\n' +
						   '  return ' + code + ';\n' +
						   '});\n';
					   
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
	}(istComponents.misc));
	
	/*global define, requirejs, isAMD, isNode, isBrowser */
	istComponents.ist = ( function(Template, directives, Context, pegjsParser, preprocess, pluginify, misc) {
		
	
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
	
	
		/* Global scope registration */
		ist.global = function(key, value) {
			Context.globalScope[key] = value;
		};
	
	
		if (isNode || (isBrowser && isAMD)) {
			pluginify(ist);
		}
		
		return ist;
	}(
		istComponents.template,
		istComponents.directives,
		istComponents.context,
		istComponents.parser,
		istComponents.preprocessor,
		istComponents.amdplugin,
		istComponents.misc
	));
		
	if (isAMD || isNode) {
		define("ist", [], function() { return istComponents.ist; });
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
