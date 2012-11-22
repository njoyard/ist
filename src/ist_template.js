/** @license
 * IST: Indented Selector Templating
 * version 0.5.4
 *
 * Copyright (c) 2012 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://github.com/k-o-x/ist
 */
(function(global) {
	"use strict";
	
	var isAMD = typeof global.define === 'function' && global.define.amd;
	
	var definition = function(requirejs) {
	
		var ist, parser, fs, extend, jsEscape, preprocess, getXhr, fetchText,
			findScriptTag,
			Context, Node, ContainerNode, BlockNode, TextNode, ElementNode,
			reservedWords = [
				'break', 'case', 'catch', 'class', 'continue', 'debugger',
				'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
				'false', 'finally', 'for', 'function', 'if', 'import', 'in',
				'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this',
				'throw', 'true', 'try',	'typeof', 'undefined', 'var', 'void',
				'while', 'with'
			],
			helpers = {},
			progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
			buildMap = [],
			currentTemplate;
		
	
		if (!Array.isArray) {
			Array.isArray = function(a) {
				return Object.prototype.toString.call(a) === '[object Array]';
			};
		}
		
			
		parser = (function() {
			var UNCHANGED = 'U', INDENT = 'I', DEDENT = 'D', UNDEF,
				generateNodeTree, parseIndent, escapedCharacter,
				createTextNode, createElement, createDirective,
				pegjsParser;

			
			// Generate node tree
			generateNodeTree = function(first, tail) {
				var stack = [new ContainerNode()],
					nodeCount = 0,
					lines, peekNode, pushNode, popNode;
					
				if (!first) {
					return stack[0];
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
					peekNode().appendChild(node);
					
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
						} else if (indent[0] === INDENT && peekNode() instanceof TextNode) {
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
				
				return peekNode();
			};
			

			// Keep track of indent
			parseIndent = function(depths, s, line) {
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
			createTextNode = function(text, line) {
				return new TextNode(text, line);
			};
			

			// Element object helper
			createElement = function(tagName, qualifiers, additions, line) {
				var elem = new ElementNode(tagName, line);

				qualifiers.forEach(function(q) {
					if (typeof q.id !== 'undefined') {
						elem.setId(q.id);
					} else if (typeof q.className !== 'undefined') {
						elem.setClass(q.className);
					} else if (typeof q.attr !== 'undefined') {
						elem.setAttribute(q.attr, q.value);
					} else if (typeof q.prop !== 'undefined') {
						elem.setProperty(q.prop, q.value);
					}
				});
				
				if (typeof additions !== 'undefined') {
					if (additions.partial.length > 0) {
						elem.setPartialName(additions.partial);
					}
					
					if (additions.textnode instanceof TextNode) {
						elem.appendChild(additions.textnode);
					}
				}

				return elem;
			};
			
			
			// Directive object helper
			createDirective = function(name, expr, line) {
				return new BlockNode(name, expr, line);
			};
			
			
			escapedCharacter = function(char) {
				if (char.length > 1) {
					// 2 or 4 hex digits coming from \xNN or \uNNNN
					return String.fromCharCode(parseInt(char, 16));
				} else {
					return { 'f': '\f', 'b': '\b', 't': '\t', 'n': '\n', 'r': '\r' }[char] || char;
				}
			};
		

// PEGjs parser start
// PEGjs parser end

			return pegjsParser;
		}());
		
		
		jsEscape = function (content) {
			return content.replace(/(['\\])/g, '\\$1')
				.replace(/[\f]/g, "\\f")
				.replace(/[\b]/g, "\\b")
				.replace(/[\t]/g, "\\t")
				.replace(/[\n]/g, "\\n")
				.replace(/[\r]/g, "\\r");
		};
		
		
		findScriptTag = function(id) {
			var found, scripts; 

			try {
				scripts = document.querySelectorAll('script#' + id);
			} catch(e) {
				// DOM exception when selector is invalid - no <script> tag with this id
				return;
			}
				
			if (scripts) {
				Array.prototype.slice.call(scripts).forEach(function(s) {
					if (!found && s.getAttribute('type') === 'text/x-ist') {
						found = s.innerHTML;
					}
				});
			}
			
			return found;
		};
	
	
		/* Extend helper (child.prototype = new Parent() + set prototype properties) */
		extend = function(Parent, Child, prototype) {
			Child.prototype = new Parent();
			Object.keys(prototype).forEach(function(k) {
				Child.prototype[k] = prototype[k];
			});
		};
	
	
		/**
		 * Context object; holds the rendering context and target document,
		 * and provides helper methods.
		 */
		Context = function(object, doc) {
			this.value = object;
			this.doc = doc || document;
			this.variables = { document: [ this.doc ] };
		};
	
	
		Context.prototype = {
			/* Node creation aliases */
			
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
				return this.doc.createTextNode(this.interpolate(text));
			},
			
			/**
			 * Adds a variable to the evaluation scope used when interpolating
			 * "{{ xxx }}" expressions and directive arguments.  Hides any
			 * previous existing variable with the same name.
			 */
			pushEvalVar: function(name, value) {
				if (typeof this.variables[name] === 'undefined') {
					this.variables[name] = [];
				}
			
				this.variables[name].unshift(value);
			},
		
			/**
			 * Removes a variable from the evaluation scope used when interpolating
			 * "{{ xxx }}" expressions and directive arguments, and returns its
			 * value.  Restores any value previously hidden by pushEvalVar.
			 */
			popEvalVar: function(name) {
				var ret = this.variables[name].shift();
			
				if (this.variables[name].length === 0) {
					delete this.variables[name];
				}
			
				return ret;
			},
		
			/**
			 * Evaluate `expr` in a scope where the current context is available
			 * as `this`, all its own properties that are not reserved words are
			 * available as locals, and the target document is available as `document`.
			 * Variables defined with pushEvalVar ar also available as locals.
			 */
			evaluate: function(expr) {
				var self = this,
					ctxNames = typeof this.value === 'object' ? Object.keys(this.value) : [],
					varNames = Object.keys(this.variables),
					ctxValues, varValues, func;
				
				// Expression is a more complex expression
				ctxNames = ctxNames.filter(function(k) { return reservedWords.indexOf(k) === -1; });
				ctxValues = ctxNames.map(function(k) { return self.value[k]; });
				varValues = varNames.map(function(k) { return self.variables[k][0]; });
		
				func = new Function(ctxNames.concat(varNames).join(','), "return " + expr + ";");
	
				return func.apply(this.value, ctxValues.concat(varValues));
			},
		
			interpolate: function(text) {		
				return text.replace(/{{((?:}(?!})|[^}])*)}}/g, (function(m, p1) { return this.evaluate(p1); }).bind(this));
			},
		
			createContext: function(newValue) {
				return new Context(newValue, this.doc);
			}
		};
	
	
		/**
		 * Base node, not renderable. Helps building context objects, exception
		 * messages, and finding tagged subtemplates.
		 */
		Node = function() {
			this.partialName = '';
		};
		
		Node.prototype = {
			sourceLine: '<unknown>',
			sourceFile: '<unknown>',
	
			completeError: function(err) {
				var current = "in '" + (this.sourceFile || '<unknown>') + "'";
			
				if (typeof this.sourceLine != 'undefined') {
					current += ' on line ' + this.sourceLine;
				}
			
				if (typeof err.istStack === 'undefined') {
					err.message += " " + current
					err.istStack = [];
				}
			
				err.istStack.push(current);
			
				return err;
			},
			
			setPartialName: function(partialName) {
				this.partialName = partialName;
			},
			
			findPartial: function(partialName) {
				if (this.partialName === partialName) {
					return this;
				}
			},
		
			render: function(context, doc) {
				if (!(context instanceof Context)) {
					context = new Context(context, doc);
				}
			
				return this._render(context);
			},
		
			_render: function(context) {
				throw new Error("Cannot render base Node");
			}
		}
	
	
		/**
		 * Text node
		 */
		TextNode = function(text, line) {
			Node.call(this);
		
			this.text = text;
			this.sourceFile = currentTemplate;
			this.sourceLine = line;
		};
	
		extend(Node, TextNode, {
			_render: function(context) {
				try {
					return context.createTextNode(this.text);
				} catch(err) {
					throw this.completeError(err);
				}
			},
		
			appendChild: function(node) {
				throw new Error("Cannot add children to TextNode");
			}
		});
	
	
		/**
		 * Container node
		 */
		ContainerNode = function() {
			Node.call(this);
			
			this.children = [];
			this.partialCache = {};
		};
	
		extend(Node, ContainerNode, {
			appendChild: function(node) {
				this.children.push(node);
			},
			
			findPartial: function(partialName) {
				var found = Node.prototype.findPartial.call(this, partialName),
					i, len;
				
				if (found) {
					return found;
				}
				
				if (typeof this.partialCache[partialName] !== 'undefined') {
					return this.partialCache[partialName];
				}
				
				found = this.children.reduce(function(found, child) {
					return found || child.findPartial(partialName);
				}, null);
				
				if (found) {
					this.partialCache[partialName] = found;
				}
				
				return found;
			},
		
			_render: function(context) {
				var fragment = context.createDocumentFragment();
			
				this.children.forEach(function(c) {
					fragment.appendChild(c._render(context));
				});
			
				return fragment;
			}
		});
	
	
		/**
		 * Element node
		 */
		ElementNode = function(tagName, line) {
			ContainerNode.call(this);
		
			this.tagName = tagName;
			this.sourceFile = currentTemplate;
			this.sourceLine = line;
			this.attributes = {};
			this.properties = {};
			this.classes = [];
			this.id = undefined;
		};
	
		extend(ContainerNode, ElementNode, {
			setAttribute: function(attr, value) {
				this.attributes[attr] = value;
			},
		
			setProperty: function(prop, value) {
				this.properties[prop] = value;
			},
		
			setClass: function(cls) {
				this.classes.push(cls);
			},
		
			setId: function(id) {
				this.id = id;
			},
		
			_render: function(context) {
				var self = this,
					node = context.createElement(this.tagName);
			
				node.appendChild(ContainerNode.prototype._render.call(this, context));
			
				Object.keys(this.attributes).forEach(function(attr) {
					try {
						var value = context.interpolate(self.attributes[attr]);
					} catch (err) {
						throw self.completeError(err);
					}
				
					node.setAttribute(attr, value);
				});
			
				Object.keys(this.properties).forEach(function(prop) {
					try {
						var value = context.interpolate(self.properties[prop]);
					} catch (err) {
						throw self.completeError(err);
					}
				
					node[prop] = value;
				});
			
				this.classes.forEach(function(cls) {
					node.classList.add(cls);
				});
			
				if (typeof this.id !== 'undefined') {
					node.id = this.id;
				}
			
				return node;
			}
		});
	
	
		/**
		 * Block node
		 */
		BlockNode = function(name, expr, line) {
			ContainerNode.call(this);
			
			this.name = name;
			this.expr = expr;
			this.sourceFile = currentTemplate;
			this.sourceLine = line;
		};
	
		extend(ContainerNode, BlockNode, {
			_render: function(context) {
				var self = this,
					container = {},
					subContext, ret;
			
				if (typeof helpers[this.name] !== 'function') {
					throw new Error('No block helper for @' + this.name + ' has been registered');
				}
			
				if (typeof this.expr !== 'undefined') {
					try {
						subContext = context.createContext(context.evaluate(this.expr));
					} catch(err) {
						throw this.completeError(err);
					}
				}
			
				container.render = ContainerNode.prototype.render.bind(container);
				container._render = ContainerNode.prototype._render.bind(self);
			
				try {
					ret = helpers[this.name].call(context, subContext, container);
				} catch (err) {
					throw this.completeError(err);
				}
			
				if (typeof ret === 'undefined') {
					return context.createDocumentFragment();
				}
			
				return ret;
			}
		});
		
	
		/**
		 * Template preprocessor; handle what the parser cannot handle
		 * - Make whitespace-only lines empty
		 * - Remove block-comments (keeping line count)
		 */
		preprocess = function(text) {
			var newlines = /\r\n|\r|\n/,
				whitespace = /^[ \t]*$/,
				comment = /\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g,
				lines = text.split(newlines);
		
			// Remove everthing from whitespace-only lines
			lines.forEach(function(l, i) {
				if (l.match(whitespace)) {
					lines[i] = "";
				}
			});
			text = lines.join('\n');
		
			// Remove block comments
			text = text.replace(comment, function(m, p1) {
				return p1.split(newlines).map(function(l) { return ''; }).join('\n');
			}); 
		
			return text;
		};
	
	
		/**
		 * Template parser
		 */
		ist = function(template, name) {
			var parsed;
		
			currentTemplate = name || '<unknown>';
		
			try {
				parsed = parser.parse(preprocess(template));
			} catch(e) {
				e.message += " in '" + currentTemplate + "' on line " + e.line +
					(typeof e.column !== 'undefined' ?  ", character " + e.column : '');
						
				currentTemplate = undefined;
				throw e;
			}
		
			currentTemplate = undefined;
		
			return parsed;
		};
	
	
		/**
		 * Node creation interface
		 * Creates nodes with IST template syntax
		 *
		 * Several nodes can be created at once using angle brackets, eg.:
		 *   ist.createNode('div.parent > div#child > "text node")
		 *
		 * Supports context variables and an optional alternative document.
		 * Does not support angle brackets anywhere else than between nodes.
		 * 
		 * Directives are supported ("div.parent > @each ctxVar > div.child")
		 */
		ist.createNode = function(branchSpec, context, doc) {
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
		ist.fromScriptTag = function(id) {
			var template = findScriptTag(id);
			
			if (template) {
				return ist(template);
			}
		};
	
	
		/**
		 * IST helper block registration; allows custom iterators/helpers that will
		 * be called with a new context.
		 */
		ist.registerHelper = function(name, helper) {
			helpers[name] = helper;
		};
	
	
		/**
		 * Built-in 'if' helper
		 */
		ist.registerHelper('if', function(ctx, tmpl) {
			if (ctx.value) {
				return tmpl.render(this);
			}
		});
	
	
		/**
		 * Built-in 'unless' helper
		 */
		ist.registerHelper('unless', function(ctx, tmpl) {
			if (!ctx.value) {
				return tmpl.render(this);
			}
		});
	
	
		/**
		 * Built-in 'with' helper
		 */
		ist.registerHelper('with', function(ctx, tmpl) {
			return tmpl.render(ctx);
		});
	
	
		/**
		 * Built-in 'each' helper
		 */
		ist.registerHelper('each', function(ctx, tmpl) {
			var fragment = this.createDocumentFragment(),
				outer = this.value,
				value = ctx.value;
		
			if (value && Array.isArray(value)) {
				value.forEach(function(item, index) {
					var sctx = ctx.createContext(item);
				
					sctx.pushEvalVar('loop', {
						first: index == 0,
						index: index,
						last: index == value.length - 1,
						length: value.length,
						outer: outer
					});
					fragment.appendChild(tmpl.render(sctx));
					sctx.popEvalVar('loop');
				});
			}
		
			return fragment;
		});
	
	
		/**
		 * Built-in 'include' helper.
		 *
		 * Usage:
		 * @include "path/to/template"
		 * @include "path/to/template.ist"
		 */
		ist.registerHelper('include', function(ctx, tmpl) {
			var what = ctx.value.replace(/\.ist$/, ''),
				scripts, found, tryReq;
			
			// Try to find a <script type="text/x-ist" id="...">
			found = findScriptTag(what);
			
			if (isAMD)
			{
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
				throw new Error("Cannot find included template '" + what + "'");
			}
		
			if (typeof found === 'string') {
				// Compile template
				found = ist(found, what);
			}
		
			if (typeof found.render === 'function') {
				// Render included template
				return found.render(this, tmpl.document);
			} else {
				throw new Error("Invalid included template '" + what + "'");
			}
		});
	
	
		if (isAMD) {
			/******************************************
			 *         Require plugin helpers         *
			 ******************************************/

			if (typeof window !== "undefined" && window.navigator && window.document) {
				getXhr = function() {
					var xhr, i, progId;
					if (typeof XMLHttpRequest !== "undefined") {
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
						throw new Error("getXhr(): XMLHttpRequest not available");
					}

					return xhr;
				};

				fetchText = function(url, callback) {
					var xhr = getXhr();
					xhr.open('GET', url, true);
					xhr.onreadystatechange = function (evt) {
						//Do not explicitly handle errors, those should be
						//visible via console output in the browser.
						if (xhr.readyState === 4) {
							if (xhr.status !== 200) {
								throw new Error("HTTP status "  + xhr.status + " when loading " + url);
							}
			
							callback(xhr.responseText);
						}
					};
					xhr.send(null);
				};
			} else if (typeof process !== "undefined" && process.versions && !!process.versions.node) {
				fs = require.nodeRequire('fs');

				fetchText = function(url, callback) {
				    var file = fs.readFileSync(url, 'utf8');
				    //Remove BOM (Byte Mark Order) from utf8 files if it is there.
				    if (file.indexOf('\uFEFF') === 0) {
				        file = file.substring(1);
				    }
				    callback(file);
				};
			}
	

		
			/******************************************
			 *        Require plugin interface        *
			 ******************************************/
	
			ist.write = function (pluginName, name, write) {
				var bmName = 'ist!' + name;
	
				if (buildMap.hasOwnProperty(bmName)) {
					var text = buildMap[bmName];
					write(text);
				}
			};

			ist.load = function (name, parentRequire, load, config) {
				var path = parentRequire.toUrl(name + '.ist'),
					dirname = name.indexOf('/') === -1 ? '.' : name.replace(/\/[^\/]*$/, '');
		
				fetchText(path, function (text) {
					var i, m, deps = ['ist'];
			
					/* Find @include calls and replace them with 'absolute' paths
					   (ie @include 'inc/include' in 'path/to/template'
						 becomes @include 'path/to/inc/include')
					   while recording all distinct include paths
					 */
						 
					text = text.replace(/^(\s*)@include\s+(?:text=)?(['"])((?:(?=(\\?))\4.)*?)\2/gm,
						function(m, p1, p2, p3) {
							if (!findScriptTag(p3)) {
								var dpath = dirname + '/' + p3.replace(/\.ist$/, '');
					
								if (deps.indexOf('ist!' + dpath) === -1) {
									deps.push('ist!' + dpath);
								}
					
								return p1 + '@include "' + dpath + '"';
							} else {
								// Script tag found, do not change directive
								return m;
							}
						});
			
					if (config.isBuild) {
						text = jsEscape(text);		
						text = "define('ist!" + name + "'," + JSON.stringify(deps) + ",function(ist){" +
							   "var template='" + text + "';" +
							   	"return ist(template,'" + name + "');" +
							   "});";
					} else {
						/* "Pretty-print" template text */
						text = jsEscape(text).replace(/\\n/g, "\\n' +\n\t               '");
						text = "define('ist!" + name + "'," + JSON.stringify(deps) + ", function(ist){ \n" +
							   "\tvar template = '" + text + "';\n" +
							   "\treturn ist(template, '" + name + "');\n" +
							   "});\n";
					}
						   
					//Hold on to the transformed text if a build.
					if (config.isBuild) {
						buildMap['ist!' + name] = text;
					}

					//IE with conditional comments on cannot handle the
					//sourceURL trick, so skip it if enabled.
					/*@if (@_jscript) @else @*/
					if (!config.isBuild) {
						text += "\r\n//@ sourceURL=" + path;
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
	
	
		return ist;
	};
	
	if (isAMD) {
		define('ist', ['require'], definition);
	} else {
		var previousIst = global.ist;
		
		global.ist = definition();
		
		global.ist.noConflict = function() {
			var ist = global.ist;
			global.ist = previousIst;
			return ist;
		};
	}
}(this));
