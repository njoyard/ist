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
define(function() {
	"use strict";
	
	var ist, parser, fs,
		extend, jsEscape, preprocess, getXhr, fetchText,
		Context, Node, ContainerNode, BlockNode, TextNode, ElementNode,
		helpers = {},
		progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
		buildMap = [];
		
	
	if (!Array.isArray) {
		Array.isArray = function(a) {
			return Object.prototype.toString.call(a) === '[object Array]';
		};
	}
	
	jsEscape = function (content) {
		return content.replace(/(['\\])/g, '\\$1')
			.replace(/[\f]/g, "\\f")
			.replace(/[\b]/g, "\\b")
			.replace(/[\t]/g, "\\t")
			.replace(/[\n]/g, "\\n")
			.replace(/[\r]/g, "\\r");
	};
	
	
	/* Extend helper (child.prototype = new Parent() + set prototype properties) */
	extend = function(Parent, Child, prototype) {
		Child.prototype = new Parent();
		Object.keys(prototype).forEach(function(k) {
			Child.prototype[k] = prototype[k];
		});
	};
	
	
	/**
	 * Context object
	 */
	Context = function(object, doc) {
		this.value = object;
		this.doc = doc || document;
	};
	
	
	Context.prototype = {
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
		
		getPath: function(path) {
			var rec;
		
			path = path.trim();
			if (path === 'this') {
				return this.value;
			}
	
			rec = function(pathArray, ctx) {
				var subcontext = ctx[pathArray.shift()];
			
				if (pathArray.length > 0) {
					return rec(pathArray, subcontext);
				} else {
					return subcontext;
				}
			}
		
			try {
				return rec(path.split('.'), this.value);
			} catch(e) {
				throw new Error("Cannot find path " + path + " in context");
			}
		},
		
		interpolate: function(text) {
			return text.replace(/{{(.*?)}}/g, (function(m, p1) { return this.getPath(p1); }).bind(this));
		},
		
		createContext: function(newValue) {
			return new Context(newValue, this.doc);
		},
		
		getSubcontext: function(path) {
			return this.createContext(this.getPath(path));
		}
	};
	
	
	/**
	 * Base node (not renderable, just helps building Context object)
	 */
	Node = function() {};
	Node.prototype = {
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
	TextNode = function(text) {
		this.text = text;
	};
	
	extend(Node, TextNode, {
		_render: function(context) {
			return context.createTextNode(this.text);
		},
		
		appendChild: function(node) {
			throw new Error("Cannot add children to TextNode");
		}
	});
	
	
	/**
	 * Container node
	 */
	ContainerNode = function() {};
	
	extend(Node, ContainerNode, {
		appendChild: function(node) {
			this.children = this.children || [];
			this.children.push(node);
		},
		
		_render: function(context) {
			var fragment = context.createDocumentFragment();
			
			this.children = this.children || [];
			this.children.forEach(function(c) {
				fragment.appendChild(c._render(context));
			});
			
			return fragment;
		}
	});
	
	
	/**
	 * Element node
	 */
	ElementNode = function(tagName) {
		this.tagName = tagName;
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
				var value = context.interpolate(self.attributes[attr]);
				node.setAttribute(attr, value);
			});
			
			Object.keys(this.properties).forEach(function(prop) {
				var value = context.interpolate(self.properties[prop]);
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
	BlockNode = function(name, value) {
		this.name = name;
		this.value = value;
	};
	
	extend(ContainerNode, BlockNode, {
		_render: function(context) {
			var self = this,
				container = {},
				subContext;
			
			if (typeof this.value !== 'undefined') {
				if (this.value.charAt(0) == '"') {
					// Direct string value
					subContext = context.createContext(this.value.substr(1, this.value.length - 2));
				} else {
					// Context path
					subContext = context.getSubContext(this.value);
				}
			}
			
			if (typeof helpers[this.name] !== 'function') {
				throw new Error('No block helper for @' + this.name + ' has been registered');
			}
			
			container.render = ContainerNode.prototype.render.bind(container);
			container._render = ContainerNode.prototype._render.bind(self);
			
			return helpers[this.name].call(context, subContext, container);
		}
	});
	
	
//PARSER//
	
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
		
		name = name || '<unknown>';
		
		try {
			parsed = parser.parse(preprocess(template));
		} catch(e) {
			throw new Error(
				"In " + name + " on line " + e.line +
				(typeof e.column !== 'undefined' ?  ", character " + e.column : '') +
				": " + e.message
			);
		}
		
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
		} else {
			// Return empty fragment
			return this.createDocumentFragment();
		}
	});
	
	
	/**
	 * Built-in 'unless' helper
	 */
	ist.registerHelper('unless', function(ctx, tmpl) {
		if (!ctx.value) {
			return tmpl.render(this);
		} else {
			// Return empty fragment
			return this.createDocumentFragment();
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
				var xitem;
				
				if (item !== null && (typeof item === 'object' || Array.isArray(item))) {
					xitem = item;
					item.loop = {
						first: index == 0,
						index: index,
						last: index == value.length - 1,
						length: value.length,
						outer: outer
					};
				} else {
					xitem = {
						toString: function() { return item.toString(); },
						loop: {
							first: index == 0,
							index: index,
							last: index == value.length - 1,
							length: value.length,
							outer: outer
						}
					};
				}
				
				fragment.appendChild(tmpl.render(ctx.createContext(xitem)));
				
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
		var what = ctx.value.replace(/\.ist$/, ''),
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
