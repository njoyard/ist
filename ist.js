/** @license
 * IST: Indented Selector Templating
 * version 0.4.5
 *
 * Copyright (c) 2012 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://github.com/k-o-x/ist
 */

/*jslint white: true, browser: true, plusplus: true */
/*global define, require, ActiveXObject */

define('ist', ['require'], function (requirejs) {
	"use strict";

	var ist,
		helpers = {},
		fs, 
		progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
		buildMap = [],
		rx = {
			newline: /\r\n|\n|\r/,
			blockcomment: /\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g,
			indent: /^(\s*)(.*)$/,
			element: /^(\w+)(.*)$/,
				elemProps: /^([.#][\w-]+|\[[^\]=]+=[^\]]+\])(.*)$/,
				elemClass: /^\.([\w-]+)$/,
				elemId: /^#([\w-]+)$/,
				elemAttr: /^\[([^\]=]+)=([^\]]+)\]$/,
			text: /^"(.*?)"?$/,
			block: /^@(\w+)(\s+.*?)?\s*$/,
				blockCtx: /^\s+([\w\.]+)/,
				blockParam: /^\s+(\w+)=(['"])((?:(?=(\\?))\4.)*?)\2/,
				blockText: /^\s+(['"])((?:(?=(\\?))\3.)*?)\1/,
			interpvar: /{{(.*?)}}/g
		},
		jsEscape, jsUnescape, findPath, interpolate, createSingleNode,
		TextNode, ContainerNode, ElementNode, BlockNode,
		getXhr, fetchText;
		

	jsEscape = function (content) {
		return content.replace(/(['\\])/g, '\\$1')
			.replace(/[\f]/g, "\\f")
			.replace(/[\b]/g, "\\b")
			.replace(/[\t]/g, "\\t")
			.replace(/[\n]/g, "\\n")
			.replace(/[\r]/g, "\\r");
	};
	
	jsUnescape = function (content) {
		var chars = {
			'\\\\': '\\',
			'\\f': '\f',
			'\\b': '\b',
			'\\t': '\t',
			'\\n': '\n',
			'\\r': '\r',
			'\\"': '\"',
			'\\\'': '\''
		};
		
		return content
			.match(/(?:(?=(\\?))\1.)/g)
			.map(function(char) {
				if (typeof chars[char] !== 'undefined') {
					return chars[char];
				} else {
					return char;
				}
			}).join('');
	};
		
	/******************************************
	 *            Actual IST code             *
	 ******************************************/
	 
		
	/**
	 * Find path ("path.to.property") inside context object
	 */
	findPath = function(path, context) {
		var rec;
		
		path = path.trim();
		if (path === 'this') {
			return context;
		}
	
		rec = function(pathArray, context) {
			var subcontext = context[pathArray.shift()];
			
			if (pathArray.length > 0) {
				return rec(pathArray, subcontext);
			} else {
				return subcontext;
			}
		}
		
		try {
			return rec(path.split('.'), context);
		} catch(e) {
			throw new Error("Cannot find path " + path + " in context");
		}
	};
	
	
	/**
	 * Interpolate {{variable}}s in 'text'
	 */
	interpolate = function(text, context) {
		return text.replace(rx.interpvar, function(m, p1) { return findPath(p1, context); });
	};
	
	
	/**
	 * Text node
	 */
	TextNode = function(text) {
		this.text = text;
	};
	
	TextNode.prototype = {
		render: function(context, doc) {
			return (doc||document).createTextNode(interpolate(this.text, context));
		},
		
		appendChild: function(node) {
			throw new Error("Cannot add children to TextNode");
		}
	};
	
	
	/**
	 * Container node
	 */
	ContainerNode = function(features) {
		var self = this;
		
		if (features) {
			Object.keys(features).forEach(function(key) {
				self[key] = features[key];
			});
		}
	};
	
	ContainerNode.prototype = {
		appendChild: function(node) {
			this.children = this.children || [];
			this.children.push(node);
		},
		
		render: function(context, doc) {
			var fragment = (doc||document).createDocumentFragment();
			
			this.children = this.children || [];
			this.children.forEach(function(c) {
				fragment.appendChild(c.render(context, doc));
			});
			
			return fragment;
		}
	};
	
	
	/**
	 * Element node
	 */
	ElementNode = function(tagName) {
		this.tagName = tagName;
		this.attributes = {};
		this.classes = [];
		this.id = undefined;
	};
	
	ElementNode.prototype = new ContainerNode({
		setAttribute: function(attr, value) {
			this.attributes[attr] = value;
		},
		
		setClass: function(cls) {
			this.classes.push(cls);
		},
		
		setId: function(id) {
			this.id = id;
		},
		
		render: function(context, doc) {
			var self = this,
				node = (doc||document).createElement(this.tagName);
			
			node.appendChild(ContainerNode.prototype.render.call(this, context, doc));
			
			Object.keys(this.attributes).forEach(function(attr) {
				var value = interpolate(self.attributes[attr],  context);
				
				if (attr.charAt(0) === '.') {
					// Property
					node[attr.substr(1)] = value;
				} else {
					// Attribute
					node.setAttribute(attr, value);
				}
				
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
	BlockNode = function(name, ctxPath, options) {
		this.name = name;
		this.ctxPath = ctxPath;
		this.options = options;
	};
	
	BlockNode.prototype = new ContainerNode({
		render: function(context, doc) {
			var self = this,
				subContext = this.ctxPath ? findPath(this.ctxPath, context) : undefined;
			
			if (typeof helpers[this.name] !== 'function') {
				throw new Error('No block helper for @' + this.name + ' has been registered');
			}
			
			return helpers[this.name].call(context, subContext, {
				document: (doc || document),
				
				render: function(ctx) {
					return ContainerNode.prototype.render.call(self, ctx, doc);
				},
				
				options: self.options
			});
		}
	});
	
	
	/**
	 * Single node creation helper
	 */
	createSingleNode = function(nodeSpec) {
		var node, m, prop, name, ctx, options, i,
			rest = nodeSpec.trim();
		
		if (m = rest.match(rx.element)) {
			node = new ElementNode(m[1]);
			rest = m[2];
	
			while (rest.length) {
				if (m = rest.match(rx.elemProps)) {
					prop = m[1];
					rest = m[2];
			
					if (m = prop.match(rx.elemClass)) {
						node.setClass(m[1]);
					} else if (m = prop.match(rx.elemId)) {
						node.setId(m[1]);
					} else if (m = prop.match(rx.elemAttr)) {
						node.setAttribute(m[1], m[2]);
					}
				} else {
					throw new Error("Invalid syntax (col " + (nodeSpec.length - rest.length + 1) + ")");
				}
			}
	
			return node;
		} else if (m = rest.match(rx.text)) {
			return new TextNode(m[1]);
		} else if (m = rest.match(rx.block)) {
			name = m[1];
			rest = m[2];
			ctx = null;
			options = {};
			i = 0;
			
			while (rest) {
				if (m = rest.match(rx.blockParam)) {
					options[m[1]] = jsUnescape(m[3]);
				} else if (i == 0 && (m = rest.match(rx.blockCtx))) {
					ctx = m[1];
				} else if (m = rest.match(rx.blockText)) {
					options.text = jsUnescape(m[2]);
				} else {
					throw new Error("Invalid syntax (col " + (nodeSpec.length - rest.length + 1) + ")");
				}
			
				rest = rest.substr(m[0].length);
				++i;
			}
			
			return new BlockNode(name, ctx, options);
		} else {
			throw new Error("Invalid syntax (col 1)");
		}
	};
	
	
	/**
	 * Template compiler
	 * Returns ContainerNode with render(context[, document]) method
	 */
	ist = function(text, name) {
		var stack = [new ContainerNode()],
			indentStack, peekNode, pushNode, popNode;
		
		name = name || '<unknown>';
	
		peekNode = function() {
			return stack[stack.length - 1];
		};
	
		// Push a node on the stack
		pushNode = function(node) {
			stack.push(node);
		};
	
		// Pop a node from the stack and add it to previous element children
		popNode = function() {
			var node;
			if (stack.length < 2) {
				throw new Error("Could not pop node from stack");
			}
		
			node = stack.pop();
			peekNode().appendChild(node);
			return node;
		};
		
		// Remove block comments, keeping line count
		text = text.replace(rx.blockcomment, function(m, p1) {
			return p1.split(rx.newline).map(function(l) { return ''; }).join('\n');
		}); 
	
		text.split(rx.newline).forEach(function(line, lineNumber) {
			var m, rest, lastIndent, indentIdx;
		
			m = line.match(rx.indent);
		
			// Skip empty lines
			if (m[2].length === 0) {
				return;
			}
			
			// Trim trailing spaces
			m[2] = m[2].trim();
		
			try {
				// Handle indent
				if (typeof indentStack === 'undefined') {
					indentStack = [m[1]];
				} else {
					lastIndent = indentStack[indentStack.length - 1];
					indentIdx = indentStack.indexOf(m[1]);
			
					if (m[1] !== lastIndent) {
						if (m[1].indexOf(lastIndent) === 0) {
							// Indent growed, push new indent
							indentStack.push(m[1]);
						} else if (indentIdx !== -1) {
							// Return to previous indent, popping nodes in their parent
							popNode();
						
							while (indentStack.length - 1> indentIdx) {
								indentStack.pop();
								popNode();
							}
						} else {
							throw new Error("Unexpected indent");
						}
					} else {
						// Indent unchanged, pop node from stack into parent (it won't have any children)
						popNode();
					}
				}
				
				// Create actual node
				pushNode(createSingleNode(m[2]));
			} catch(e) {
				var err = new Error(e.message + ' in ' + name + ' on line ' + (lineNumber+1));
				err.stack = e.stack;
				throw err;
			}
		});
		
		// Collapse remaining stack
		while (stack.length > 1) {
			popNode();
		}
		
		return peekNode();
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
		if (ctx) {
			return tmpl.render(this);
		} else {
			// Return empty fragment
			return tmpl.document.createDocumentFragment();
		}
	});
	
	
	/**
	 * Built-in 'unless' helper
	 */
	ist.registerHelper('unless', function(ctx, tmpl) {
		if (!ctx) {
			return tmpl.render(this);
		} else {
			// Return empty fragment
			return tmpl.document.createDocumentFragment();
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
		var fragment = tmpl.document.createDocumentFragment(),
			outer = this;
		
		if (ctx) {
			ctx.forEach(function(item, index) {
				var xitem;
				
				if (item !== null && (typeof item === 'object' || typeof item === 'array')) {
					xitem = item;
					item.loop = {
						index: index,
						outer: outer
					};
				} else {
					xitem = {
						toString: function() { return item.toString(); },
						loop: {
							index: index,
							outer: outer
						}
					};
				}
				
				fragment.appendChild(tmpl.render(xitem));
				
				if (xitem === item) {
					delete item.loop;
				}
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
		var what = tmpl.options.text.replace(/\.ist$/, ''),
			found, tryReq;
			
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
				if (tryReq.length === 0) {
					throw new Error("Cannot find included template '" + what + "'");
				}
			}
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
					var dpath = dirname + '/' + p3.replace(/\.ist$/, '');
					
					if (deps.indexOf('ist!' + dpath) === -1) {
						deps.push('ist!' + dpath);
					}
					
					return p1 + '@include "' + dpath + '"';
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
	
	return ist;
});
