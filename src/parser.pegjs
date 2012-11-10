/* Initialization */
{
	var UNCHANGED = 'U', INDENT = 'I', DEDENT = 'D', UNDEF,
		depths = [0],
		generateNodeTree, parseIndent, escapedCharacter,
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
	createTextNode = function(text, line) {
		return new TextNode(text, line);
	};
	

	// Element object helper
	createElement = function(tagName, qualifiers, tag, line) {
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
		
		if (typeof tag !== 'undefined') {
			elem.setTag(tag);
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
}

/* PEGjs rules */

templateLines
= newline* first:line? tail:(newline+ line)* newline*
{ return generateNodeTree(first, tail); }

__ "whitespace"
= [ \t]

line
= depth:indent s:(element / textNode / directive) __*
{ return { indent: depth, item: s, num: line }; }

indent "indent"
= s:__*
{ return parseIndent(s, line); }

newline "new line"
= "\n"

character "character"
= [^\n]

identifier "identifier"
= h:[a-z_]i t:[a-z0-9_-]i*
{ return h + t.join(''); }

nodeTag
= __+ "!" tag:identifier
{ return tag; }

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
= qualifiers:elemQualifier+ tag:nodeTag?
{ return createElement('div', qualifiers, tag, line); }

explicitElement
= tagName:identifier qualifiers:elemQualifier* tag:nodeTag?
{ return createElement(tagName, qualifiers, tag, line); }

textNode "text node"
= text:quotedText
{ return createTextNode(text, line); }

escapedUnicode
= "u" a:[0-9a-z]i b:[0-9a-z]i c:[0-9a-z]i d:[0-9a-z]i
{ return '' + a + b + c + d; }

escapedASCII
= "x" a:[0-9a-z]i b:[0-9a-z]i
{ return '' + a + b; }

escapedCharacter 
= "\\" c:(escapedUnicode / escapedASCII / character)
{ return escapedCharacter(c); }

doubleQuotedText
= "\"" chars:(escapedCharacter / [^\\\n\"])* "\""
{ return chars.join(''); }

singleQuotedText
= "'" chars:(escapedCharacter / [^\\\n'])* "'"
{ return chars.join(''); }

quotedText "quoted text"
= doubleQuotedText / singleQuotedText

directive "directive"
= exprDirective / simpleDirective

simpleDirective
= "@" name:identifier
{ return createDirective(name, undefined, line); }

exprDirective
= "@" name:identifier __+ expr:character+
{ return createDirective(name, expr.join(''), line); }


