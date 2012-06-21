/* Initialization */
{
	var UNCHANGED = 'U', INDENT = 'I', DEDENT = 'D', UNDEF,
		depths = [0],
		generateNodeTree, parseIndent,
		createTextNode, createElement, createDirective;

	
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
				throw indent;
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
	parseIndent = function(s, line) {
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
	createTextNode = function(text) {
		if (text.charAt(text.length - 1) === '"') {
			text = text.substr(0, text.length - 1);
		}
		
		return new TextNode(text);
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

templateLines
= newlines first:line? tail:(newlines line)* newlines
{ return generateNodeTree(first, tail); }

line
= depth:indent s:(element / textNode / directive) [ \t]*
{ return { indent: depth, item: s, num: line }; }

indent "indent"
= s:[ \t]*
{ return parseIndent(s, line); }

newlines "new lines"
= "\n"*

identifier "identifier"
= h:[a-z_]i t:[a-z0-9_-]i*
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
= "\"" text:[^\n]*
{ return createTextNode(text.join('')); }

contextPath "context property path"
= first:identifier tail:("." identifier)*
{
	var ret = [first];
	tail.forEach(function(i) {
		ret.push(i[1]);
	});
	return ret.join('.');
}

quotedText "quoted text"
= ("\"" chars:[^\"]* "\"")
{ return chars.join(''); }

directiveParameter "directive parameter"
= name:(identifier "=")? value:quotedText
{ return { name: name ? name[0] : 'text', value: value }; }

directive "directive"
= "@" name:identifier path:(" " contextPath)? parameters:(" " directiveParameter)*
{ return createDirective(name, path, parameters); }

