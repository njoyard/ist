/*global define */
define(function() {
	"use strict";

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
			if (additions.partial.length > 0) {
				elem.partial = additions.partial;
			}
		
			if (typeof additions.textnode !== "undefined" &&
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
});
