/** @license
 * IST: Indented Selector Templating
 * version 0.3 - require plugin
 *
 * Copyright (c) 2012 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://github.com/k-o-x/ist
 *
 * Code shamelessly inspired from Alex Sexton's hbs plugin
 * Only works in a browser environment for now
 */

/*jslint white: true, browser: true, plusplus: true */
/*global define, require, ActiveXObject */

define('ist', [], function () {
	"use strict";

	var ist,
		helpers = {},
		fs, 
		progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
		buildMap = [];
		
		
	/******************************************
	 *            Actual IST code             *
	 ******************************************/
		
	/**
	 * Find path ("path.to.property") inside context object
	 */
	function findPath(path, context) {
		path = path.trim();
		if (path === 'this') {
			return context;
		}
	
		function rec(pathArray, context) {
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
	function interpolate(text, context) {
		return text.replace(/{{(.*?)}}/g, function(m, p1) { return findPath(p1, context); });
	};
	
	
	/**
	 * Text node
	 */
	function TextNode(text) {
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
	function ContainerNode(features) {
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
	function ElementNode(tagName) {
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
	function BlockNode(name, ctxPath) {
		this.name = name;
		this.ctxPath = ctxPath;
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
				}
			});
		}
	});	
	
	
	/**
	 * Template compiler
	 * Returns ContainerNode with render(context[, document]) method
	 */
	ist = function(text, name) {
		var rx = {
				indent: /^(\s*)(.*)$/,
				element: /^([a-z0-9]+)(.*)$/,
					elemProps: /^([.#][a-zA-Z0-9_-]+|\[[^\]=]+=[^\]]+\])(.*)$/,
					elemClass: /^\.([a-zA-Z0-9_-]+)$/,
					elemId: /^#([a-zA-Z0-9_-]+)$/,
					elemAttr: /^\[([^\]=]+)=([^\]]+)\]$/,
				text: /^"(.*?)"?$/,
				block: /^@([a-zA-Z0-9_-]+)(\s+(.*))?$/
			},
			stack = [new ContainerNode()],
			indentStack;
		
		
		name = name || '<unknown>';
	
		function peekNode() {
			return stack[stack.length - 1];
		};
	
		// Push a node on the stack
		function pushNode(node) {
			stack.push(node);
		};
	
		// Pop a node from the stack and add it to previous element children
		function popNode() {
			var node;
			if (stack.length < 2) {
				throw new Error("Could not pop node from stack");
			}
		
			node = stack.pop();
			peekNode().appendChild(node);
			return node;
		};
	
		text.split('\n').forEach(function(line, lineNumber) {
			var m, node, prop, rest, lastIndent, indentIdx;
		
			m = line.match(rx.indent);
		
			// Skip empty lines
			if (m[2].length === 0) {
				return;
			} 
		
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
				
				rest = m[2];
		
				// Handle actual node
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
							throw new Error("Invalid syntax (col " + (line.length - rest.length + 1) + ")");
						}
					}
			
					pushNode(node);
				} else if (m = rest.match(rx.text)) {
					pushNode(new TextNode(m[1]));
				} else if (m = rest.match(rx.block)) {
					pushNode(new BlockNode(m[1], m[3]));
				} else {
					throw new Error("Invalid syntax (col 1)");
				}
			} catch(e) {
				throw new Error(e.message + ' in ' + name + ' on line ' + (lineNumber+1));
			}
		});
		
		// Collapse remaining stack
		while (stack.length > 1) {
			popNode();
		}
		
		return peekNode();
	};
	
	
	/**
	 * IST helper block registration; allows custom iterators/helpers that will
	 * be called with a new context.
	 */
	ist.registerHelper = function(name, helper) {
		helpers[name] = helper;
	};
	
	
	/**
	 * Base 'if' helper
	 */
	ist.registerHelper('if', function(subcontext, subtemplate) {
		if (subcontext) {
			return subtemplate.render(this);
		} else {
			// Return empty fragment
			return subtemplate.document.createDocumentFragment();
		}
	});
	
	
	/**
	 * Base 'unless' helper
	 */
	ist.registerHelper('unless', function(subcontext, subtemplate) {
		if (!subcontext) {
			return subtemplate.render(this);
		} else {
			// Return empty fragment
			return subtemplate.document.createDocumentFragment();
		}
	});
	
	
	/**
	 * Base 'with' helper
	 */
	ist.registerHelper('with', function(subcontext, subtemplate) {
		return subtemplate.render(subcontext);
	});
	
	
	/**
	 * Base 'each' helper
	 */
	ist.registerHelper('each', function(subcontext, subtemplate) {
		var fragment = subtemplate.document.createDocumentFragment();
		
		subcontext.forEach(function(item) {	
			fragment.appendChild(subtemplate.render(item));
		});
		
		return fragment;
	});


	/******************************************
	 *         Require plugin helpers         *
	 ******************************************/

	function getXhr() {
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

	function fetchText(url, callback) {
		var xhr = getXhr();
		xhr.open('GET', url, true);
		xhr.onreadystatechange = function (evt) {
			//Do not explicitly handle errors, those should be
			//visible via console output in the browser.
			if (xhr.readyState === 4) {
				callback(xhr.responseText);
			}
		};
		xhr.send(null);
	};


	function jsEscape (content) {
		return content.replace(/(['\\])/g, '\\$1')
			.replace(/[\f]/g, "\\f")
			.replace(/[\b]/g, "\\b")
			.replace(/[\t]/g, "\\t")
			.replace(/[\n]/g, "\\n' +\n\t\t'")
			.replace(/[\r]/g, "\\r");
	};
	

	/******************************************
	 *        Require plugin interface        *
	 ******************************************/
	
	ist.get = function () {
		return domton;
	};

	ist.write = function (pluginName, name, write) {
		if (buildMap.hasOwnProperty(name)) {
			var text = buildMap[name];
			write(text);
		}
	};

	ist.version = '0.3';

	ist.load = function (name, parentRequire, load, config) {
		var path = parentRequire.toUrl(name + '.ist');
		
		fetchText(path, function (text) {
			var i;
			
			text = "/* START_TEMPLATE */\n" + 
				   "define('ist!" + name + "',['ist'], function(ist){ \n" +
				   "\tvar template = '" + jsEscape(text) + "';\n" +
				   "\treturn ist(template, '" + name + "');\n" +
				   "});\n";
				   
			//Hold on to the transformed text if a build.
			if (config.isBuild) {
				buildMap[name] = text;
			}

			//IE with conditional comments on cannot handle the
			//sourceURL trick, so skip it if enabled.
			/*@if (@_jscript) @else @*/
			if (!config.isBuild) {
				text += "\r\n//@ sourceURL=" + path;
			}
			/*@end@*/
			
			load.fromText(name, text);

			//Give result to load. Need to wait until the module
			//is fully parse, which will happen after this
			//execution.
			parentRequire([name], function (value) {
				load(value);
			});
		});
	};
	
	return ist;
});
