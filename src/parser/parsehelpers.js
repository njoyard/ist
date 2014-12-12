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
				line: this.line
			};

		if (typeof this.id !== "undefined") {
			o.id = this.id;
		}

		if (typeof this.classes !== "undefined" && this.classes.length > 0) {
			o.classes = this.classes;
		}

		if (typeof this.attributes !== "undefined" && Object.keys(this.attributes).length > 0) {
			o.attributes = this.attributes;
		}

		if (typeof this.properties !== "undefined" && this.properties.length > 0) {
			o.properties = this.properties;
		}

		if (typeof this.events !== "undefined" && Object.keys(this.events).length > 0) {
			o.events = this.events;
		}

		if (typeof this.children !== "undefined" && this.children.length > 0) {
			o.children = this.children;
		}

		if (typeof this.partial !== "undefined") {
			o.partial = this.partial;
		}

		return o;
	};

	directiveToJSON = function() {
		var o = {
			directive: this.directive,
			expr: this.expr,
			line: this.line
		};

		if (typeof this.children !== "undefined" && this.children.length > 0) {
			o.children = this.children;
		}

		return o;
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
			if (additions.partial) {
				elem.partial = additions.partial;
			}

			if (additions.textnode &&
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
