/** @license
 * IST: Indented Selector Templating
 * version 0.5.5
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
	
		var ist, parser, fs,
		
			// Helper functions
			extend, jsEscape, preprocess, getXhr, fetchText,
			findScriptTag, isValidIdentifier,
			
			// Constructors
			Context, Template,
			
			// Helper data
			reservedWords = [
				'break', 'case', 'catch', 'class', 'continue', 'debugger',
				'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
				'false', 'finally', 'for', 'function', 'if', 'import', 'in',
				'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this',
				'throw', 'true', 'try',	'typeof', 'undefined', 'var', 'void',
				'while', 'with'
			],
			// Incomplete (a lot of unicode points are missing), but still reasonable
			identifierRE = /^[$_a-z][$_a-z0-9]*$/i,
			codeIndent = "  ",
			helpers = {},
			progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
			buildMap = [];
		
	
		if (!Array.isArray) {
			Array.isArray = function(a) {
				return Object.prototype.toString.call(a) === '[object Array]';
			};
		}
		
		isValidIdentifier = function(candidate) {
			return identifierRE.test(candidate) && reservedWords.indexOf(candidate) === -1;
		};
		
			
		parser = (function() {
			var UNCHANGED = 'U', INDENT = 'I', DEDENT = 'D', UNDEF,
				generateNodeTree, parseIndent, escapedCharacter,
				createTextNode, createElement, createDirective,
				pegjsParser;

			
			// Generate node tree
			generateNodeTree = function(first, tail) {
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
				return { text: text, line: line };
			};
			

			// Element object helper
			createElement = function(tagName, qualifiers, additions, line) {
				var elem = {
					tagName: tagName,
					line: line,
					classes: [],
					attributes: {},
					properties: {},
					events: {},
					children: []
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
			createDirective = function(name, expr, line) {
				return {
					directive: name,
					expr: expr,
					line: line,
					children: []
				};
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
			this.scopes = [ { document: this.doc } ];
			
			if (typeof object !== 'undefined') {
				this.scopes.push(object);
			}
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
			
			/* Push an object on the scope stack. All its properties will be
			   usable inside expressions and hide any previously available
			   property with the same name */
			pushScope: function(scope) {
				this.scopes.unshift(scope);
			},
			
			/* Pop the last object pushed on the scope stack  */
			popScope: function() {
				if (this.scopes.length < 3) {
					throw new Error("No scope left to pop out");
				}
				
				return this.scopes.shift();
			},
			
			/* Deprecated, use pushScope */
			pushEvalVar: function(name, value) {
				var scope = {};
				scope[name] = value;
				this.pushScope(scope);
			},
			
			/* Deprecated, use pushScope */
			popEvalVar: function(name) {
				var scope = scopes[0];
				
				if (typeof scope[name] === 'undefined' || Object.keys(scope).length > 1) {
					throw new Error("Cannot pop variable, does not match top scope");
				}
				
				return this.popScope()[name];
			},
		
			/**
			 * Evaluate `expr` in a scope where the current context is available
			 * as `this`, all its own properties that are not reserved words are
			 * available as locals, and the target document is available as `document`.
			 */
			evaluate: function(expr) {
				var fexpr = "return " + expr + ";",
					scopeNames = [],
					func;

				this.scopes.forEach(function(scope, index) {
					scopeNames.push("scope" + index);
					fexpr = "with(scope" + index + "){\n" + fexpr + "\n}";
				});
				
				func = new Function(scopeNames.join(','), fexpr);
				
				return func.apply(this.value, this.scopes);
			},
		
			interpolate: function(text) {		
				return text.replace(/{{((?:}(?!})|[^}])*)}}/g, (function(m, p1) { return this.evaluate(p1); }).bind(this));
			},
		
			createContext: function(newValue) {
				return new Context(newValue, this.doc);
			}
		};
		
		
		/**
		 * Template object; encapsulate template nodes and rendering helpers
		 */
		var Template = function(name, nodes) {
			this.name = name || '<unknown>';
			this.nodes = nodes;
		};
		
		Template.prototype = {
			/* Complete an Error object with information about the current
			   node and template */
			completeError: function(err, node) {
				var current = "in '" + this.name + "' on line "
					+ (node.line || '<unknown>');
				
				if (typeof err.istStack === 'undefined') {
					err.message += " " + current;
					err.istStack = [];
				}
				
				err.istStack.push(current);
				return err;
			},

			/* Look for a node with the given partial name and return a new
			   Template object if found */
			findPartial: function(name) {
				var result, rec;
				
				rec = function(name, nodes) {
					var found, i, len,
						results = nodes.filter(function(n) {
							if (n.partial) console.log("found partial " + n.partial);
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
				var rec, fragment, self = this;
				
				if (!(context instanceof Context)) {
					context = new Context(context, doc);
				}
				
				rec = function(ctx, node) {
					switch (true) {
						case typeof node.text !== 'undefined':
							return self._renderTextNode(ctx, node);
							break;
							
						case typeof node.directive !== 'undefined':
							return self._renderDirective(ctx, node);
							break;
							
						case typeof node.tagName !== 'undefined':
							var elem = self._renderElement(ctx, node);
							node.children.forEach(function(child) {
								elem.appendChild(rec(ctx, child));
							});
							return elem;
							break;
					}
				};
					
				fragment = context.createDocumentFragment();
			
				this.nodes.forEach(function(node) {
					fragment.appendChild(rec(context, node));
				});
			
				return fragment;
			},
			
			/* Return code to regenerate this template */
			getCode: function(pretty) {
				return "new ist.Template("
					+ JSON.stringify(this.name) + ", "
					+ JSON.stringify(this.nodes, null, pretty ? 1 : 0)
					+ ");";
			},
			
			/* Text node rendering helper */
			_renderTextNode: function(ctx, node) {
				try {
					return ctx.createTextNode(node.text);
				} catch (err) {
					throw this.completeError(err, node);
				}
			},
			
			/* Element rendering helper */
			_renderElement: function(ctx, node) {
				var elem = ctx.createElement(node.tagName);
			
				// Set attrs, properties, events, classes and ID
				Object.keys(node.attributes).forEach(function(attr) {
					try {
						var value = ctx.interpolate(node.attributes[attr]);
					} catch (err) {
						throw this.completeError(err, node);
					}
				
					elem.setAttribute(attr, value);
				}, this);
			
				Object.keys(node.properties).forEach(function(prop) {
					try {
						var value = ctx.interpolate(node.properties[prop]);
					} catch (err) {
						throw this.completeError(err, node);
					}
				
					elem[prop] = value;
				}, this);
				
				Object.keys(node.events).forEach(function(event) {
					node.events[event].forEach(function(expr) {
						try {
							var handler = ctx.evaluate(expr);
						} catch(err) {
							throw this.completeError(err, node);
						}
					
						elem.addEventListener(event, handler, false);
					}, this);
				}, this);
			
				node.classes.forEach(function(cls) {
					elem.classList.add(cls);
				});
			
				if (typeof node.id !== 'undefined') {
					elem.id = node.id;
				}
			
				return elem;
			},
			
			/* Directive rendering helper */
			_renderDirective: function(ctx, node) {
				var self = this,
					subTemplate = new Template(this.name, node.children),
					helper = helpers[node.directive],
					subCtx, ret;
			
				if (typeof helper !== 'function') {
					throw new Error('No block helper for @' + node.directive + ' has been registered');
				}
			
				if (typeof node.expr !== 'undefined') {
					try {
						subCtx = ctx.createContext(ctx.evaluate(node.expr));
					} catch(err) {
						throw this.completeError(err, node);
					}
				}
			
				try {
					ret = helper.call(ctx, subCtx, subTemplate);
				} catch (err) {
					throw this.completeError(err, node);
				}
			
				if (typeof ret === 'undefined') {
					return ctx.createDocumentFragment();
				}
			
				return ret;
			}
		};
	
	
		/**
		 * Template preprocessor; handle what the parser cannot handle
		 * - Make whitespace-only lines empty
		 * - Remove block-comments (keeping line count)
		 */
		preprocess = function(text) {
			var newlines = /\r\n|\r|\n/,
				whitespace = /^[ \t]*$/,
				comment = /\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g,
				lines;
		
			// Remove block comments
			text = text.replace(comment, function(m, p1) {
				return p1.split(newlines).map(function(l) { return ''; }).join('\n');
			}); 
		
			// Remove everthing from whitespace-only lines
			lines = text.split(newlines);
			lines.forEach(function(l, i) {
				if (l.match(whitespace)) {
					lines[i] = "";
				}
			});
			text = lines.join('\n');
		
			return text;
		};
	
	
		/**
		 * Template parser
		 */
		ist = function(template, name) {
			var parsed;
			
			name = name || '<unknown>';
			
			try {
				parsed = parser.parse(preprocess(template));
			} catch(e) {
				e.message += " in '" + name + "' on line " + e.line +
					(typeof e.column !== 'undefined' ?  ", character " + e.column : '');
				throw e;
			}
		
			return new Template(name, parsed);
		};
		
		/* Export constructors */
		ist.Context = Context;
		ist.Template = Template;
	
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
				
					sctx.pushScope({
						loop: {
							first: index == 0,
							index: index,
							last: index == value.length - 1,
							length: value.length,
							outer: outer
						}
					});
					fragment.appendChild(tmpl.render(sctx));
					sctx.popScope();
				});
			}
		
			return fragment;
		});
		
		
		/**
		 * Built-in 'eachkey' helper
		 */
		ist.registerHelper('eachkey', function(ctx, tmpl) {
			var fragment = this.createDocumentFragment(),
				outer = this.value,
				value = ctx.value,
				keys;
		
			if (value) {
				keys = Object.keys(value);
				keys.forEach(function(key, index) {
					var sctx = ctx.createContext({
						key: key,
						value: value[key],
						loop: {
							first: index == 0,
							index: index,
							last: index == keys.length - 1,
							length: keys.length,
							object: value,
							outer: outer
						}
					});
					
					fragment.appendChild(tmpl.render(sctx));
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
				var path, dirname, doParse = true;
					
				if (/!bare$/.test(name)) {
					doParse = false;
					name = name.replace(/!bare$/, '');
				}
					
				path = parentRequire.toUrl(name + '.ist'),
				dirname = name.indexOf('/') === -1 ? '.' : name.replace(/\/[^\/]*$/, '');
		
				fetchText(path, function (text) {
					var code, i, m, deps = ['ist'];
			
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
						
					if (doParse) {
						/* Get parsed code */
						code = ist(text, name).getCode(true);
						text = "define('ist!" + name + "'," + JSON.stringify(deps) + ", function(ist) {\n" +
							   "  return " + code + ";\n" +
							   "});\n";
					} else {
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
