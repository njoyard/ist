/* Initialization */
{
	var INDENT = 'INDENT', DEDENT = 'DEDENT', UNDEF,
		depths = [0],
		generateNodeTree, parseIndent, createElement, createDirective;

	
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
				
			if (item instanceof Error) {
				throw item;
			} else if (item === DEDENT) {
				indent = DEDENT;
				popNode();
			} else if (item === INDENT) {
				indent = INDENT;
			} else if (typeof item !== 'undefined') {
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
			dents = [],
			err;

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
			err = new Error("Unexpected indent");
			err.line = line;
			err.column = 1;
			return [err];
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
= nonEmptyLine / emptyLine

emptyLine "empty line"
= [ \t]*
{ return; }

nonEmptyLine
= depth:indent s:(element / textNode / directive) [ \t]*
{ return s; }

indent "indent"
= s:[ \t]*
{ return parseIndent(s, line); }

newline "new line"
= "\n"

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
= "\"" text:[^\n]* "\""?
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

