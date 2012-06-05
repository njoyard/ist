/* Initialization */
{
	var INDENT = 'INDENT', DEDENT = 'DEDENT', UNDEF,
		depths = [0],
		findPath, interpolate, TextNode, ContainerNode, ElementNode, BlockNode,
		generateNodeTree, parseIndent, createElement, createDirective;
		
		
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
		this.properties = {};
		this.classes = [];
		this.id = undefined;
	};
	
	ElementNode.prototype = new ContainerNode({
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
		
		render: function(context, doc) {
			var self = this,
				node = (doc||document).createElement(this.tagName);
			
			node.appendChild(ContainerNode.prototype.render.call(this, context, doc));
			
			Object.keys(this.attributes).forEach(function(attr) {
				var value = interpolate(self.attributes[attr],  context);
				node.setAttribute(attr, value);
			});
			
			Object.keys(this.properties).forEach(function(prop) {
				var value = interpolate(self.attributes[prop],  context);
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
	
		
	// Generate node tree
	generateNodeTree = function(first, tail) {
		var stack = [new ContainerNode()],
			indent, peekNode, pushNode, popNode;
			
		/* Node stack helpers */
		
		peekNode = function() {
			return stack[stack.length - 1];
		};
	
		pushNode = function(node) {
			stack.push(node);
		};
	
		popNode = function() {
			var node;
			if (stack.length < 2) {
				throw new Error("Could not pop node from stack");
			}
		
			node = stack.pop();
			peekNode().appendChild(node);
			return node;
		};
	
		tail.unshift([null, first]);
		tail.forEach(function(t, index) {
			var item = t[1];
				
			if (item === DEDENT) {
				indent = DEDENT;
				popNode();
			} else if (item === INDENT) {
				indent = INDENT;
			} else {
				if (index > 0) {
					popNode();
				}
				
				pushNode(item);
				indent = UNDEF;
			}
		});
		
		// Collapse remaining stack
		while (stack.length > 1) {
			popNode();
		}
		
		return peekNode();
	};
	

	// Keep track of indent, inserting "INDENT" and "DEDENT" tokens
	parseIndent = function(s, line) {
		var depth = s.length,
			dents = [];

		if (depth.length === 0) {
			// First line, this is the reference indentation
			depths.push(depth);
			return [];
		}

		if (depth == depths[0]) {
			// Same indent as previous line
			return [];
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
			throw new Error("Unexpected indent on line " + line);
		}

		return dents;
	};
	

	// Element object helper
	createElement = function(tagName, qualifiers) {
		var elem = new ElementNode(tagName);

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

		return elem;
	};
	
	
	// Directive object helper
	createDirective = function(name, path, parameters) {
		var options = {};

		parameters.forEach(function(p) {
			options[p[1].name] = p[1].value;
		});
		
		return new BlockNode(name, path ? path[1] : undefined, options);
	};
}

/* PEGjs rules */

templateFile
= first:line tail:(newline line)* newline?
{ return generateNodeTree(first, tail); }

line
= depth:indent s:(element / textNode / directive)
{ return s; }

indent "indent"
= s:[ \t]*
{ return parseIndent(s, line); }

newline "new line"
= "\n"

text
= c:[^\n]*
{ return c.join(''); }

identifier "identifier"
= h:[a-zA-Z_] t:[a-zA-Z0-9_-]*
{ return h + t.join(''); }

elemId
= "#" id:identifier
{ return { 'id': id }; }

elemClass
= "." cls:identifier
{ return { 'className': cls }; }

elemAttribute
= "[" attr:identifier "=" value:[^\n\]]* "]"
{ return { 'attr': attr, 'value': value.join('') }; }

elemProperty
= "[" "." prop:identifier "=" value:[^\n\]]* "]"
{ return { 'prop': prop, 'value': value.join('') }; }

elemQualifier "element qualifier"
= elemId / elemClass / elemAttribute / elemProperty

element "element"
= implicitElement / explicitElement

implicitElement
= qualifiers:elemQualifier+
{ return createElement('div', qualifiers); }

explicitElement
= tagName:identifier qualifiers:elemQualifier*
{ return createElement(tagName, qualifiers); }

textNode "text node"
= "\"" text:[^\n\"]* "\""
{ return new TextNode(text.join('')); }

contextPath "context property path"
= first:identifier tail:("." identifier)*
{
	var ret = [first];
	tail.forEach(function(i) {
		ret.push(i[1]);
	});
	return ret;
}

quotedText "quoted text"
= "\"" chars:[^\"]* "\""
{ return chars.join(''); }

directiveParameter "directive parameter"
= name:(identifier "=") value:quotedText
{ return { name: name ? name[0] : 'text', value: value }; }

directive "directive"
= "@" name:identifier path:(" " contextPath)? parameters:(" " directiveParameter)*
{ return createDirective(name, path, parameters); }

