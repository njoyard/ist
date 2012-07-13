/** @license
 * IST: Indented Selector Templating
 * version 0.5
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
	BlockNode = function(name, path, value) {
		this.name = name;
		this.path = path;
		this.value = value;
	};
	
	extend(ContainerNode, BlockNode, {
		_render: function(context) {
			var self = this,
				container = {},
				subContext, ret;
			
			if (typeof helpers[this.name] !== 'function') {
				throw new Error('No block helper for @' + this.name + ' has been registered');
			}
			
			if (typeof this.path !== 'undefined') {
				subContext = context.getSubcontext(this.path);
			} else if (typeof this.value !== 'undefined') {
				subContext = context.createContext(this.value);
			}
			
			container.render = ContainerNode.prototype.render.bind(container);
			container._render = ContainerNode.prototype._render.bind(self);
			
			ret = helpers[this.name].call(context, subContext, container);
			
			if (typeof ret === 'undefined') {
				return context.createDocumentFragment();
			}
			
			return ret;
		}
	});
	
	
parser = (function(){
  /*
   * Generated by PEG.js 0.7.0.
   *
   * http://pegjs.majda.cz/
   */
  
  function quote(s) {
    /*
     * ECMA-262, 5th ed., 7.8.4: All characters may appear literally in a
     * string literal except for the closing quote character, backslash,
     * carriage return, line separator, paragraph separator, and line feed.
     * Any character may appear in the form of an escape sequence.
     *
     * For portability, we also escape escape all control and non-ASCII
     * characters. Note that "\0" and "\v" escape sequences are not used
     * because JSHint does not like the first and IE the second.
     */
     return '"' + s
      .replace(/\\/g, '\\\\')  // backslash
      .replace(/"/g, '\\"')    // closing quote character
      .replace(/\x08/g, '\\b') // backspace
      .replace(/\t/g, '\\t')   // horizontal tab
      .replace(/\n/g, '\\n')   // line feed
      .replace(/\f/g, '\\f')   // form feed
      .replace(/\r/g, '\\r')   // carriage return
      .replace(/[\x00-\x07\x0B\x0E-\x1F\x80-\uFFFF]/g, escape)
      + '"';
  }
  
  var result = {
    /*
     * Parses the input with a generated parser. If the parsing is successfull,
     * returns a value explicitly or implicitly specified by the grammar from
     * which the parser was generated (see |PEG.buildParser|). If the parsing is
     * unsuccessful, throws |PEG.parser.SyntaxError| describing the error.
     */
    parse: function(input, startRule) {
      var parseFunctions = {
        "templateLines": parse_templateLines,
        "line": parse_line,
        "__": parse___,
        "indent": parse_indent,
        "newline": parse_newline,
        "character": parse_character,
        "identifier": parse_identifier,
        "elemId": parse_elemId,
        "elemClass": parse_elemClass,
        "elemAttribute": parse_elemAttribute,
        "elemProperty": parse_elemProperty,
        "elemQualifier": parse_elemQualifier,
        "element": parse_element,
        "implicitElement": parse_implicitElement,
        "explicitElement": parse_explicitElement,
        "textNode": parse_textNode,
        "contextPath": parse_contextPath,
        "escapedUnicode": parse_escapedUnicode,
        "escapedASCII": parse_escapedASCII,
        "escapedCharacter": parse_escapedCharacter,
        "doubleQuotedText": parse_doubleQuotedText,
        "singleQuotedText": parse_singleQuotedText,
        "quotedText": parse_quotedText,
        "directive": parse_directive,
        "simpleDirective": parse_simpleDirective,
        "pathDirective": parse_pathDirective,
        "valueDirective": parse_valueDirective
      };
      
      if (startRule !== undefined) {
        if (parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      } else {
        startRule = "templateLines";
      }
      
      var pos = { offset: 0, line: 1, column: 1, seenCR: false };
      var reportFailures = 0;
      var rightmostFailuresPos = { offset: 0, line: 1, column: 1, seenCR: false };
      var rightmostFailuresExpected = [];
      
      function padLeft(input, padding, length) {
        var result = input;
        
        var padLength = length - input.length;
        for (var i = 0; i < padLength; i++) {
          result = padding + result;
        }
        
        return result;
      }
      
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        var escapeChar;
        var length;
        
        if (charCode <= 0xFF) {
          escapeChar = 'x';
          length = 2;
        } else {
          escapeChar = 'u';
          length = 4;
        }
        
        return '\\' + escapeChar + padLeft(charCode.toString(16).toUpperCase(), '0', length);
      }
      
      function clone(object) {
        var result = {};
        for (var key in object) {
          result[key] = object[key];
        }
        return result;
      }
      
      function advance(pos, n) {
        var endOffset = pos.offset + n;
        
        for (var offset = pos.offset; offset < endOffset; offset++) {
          var ch = input.charAt(offset);
          if (ch === "\n") {
            if (!pos.seenCR) { pos.line++; }
            pos.column = 1;
            pos.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            pos.line++;
            pos.column = 1;
            pos.seenCR = true;
          } else {
            pos.column++;
            pos.seenCR = false;
          }
        }
        
        pos.offset += n;
      }
      
      function matchFailed(failure) {
        if (pos.offset < rightmostFailuresPos.offset) {
          return;
        }
        
        if (pos.offset > rightmostFailuresPos.offset) {
          rightmostFailuresPos = clone(pos);
          rightmostFailuresExpected = [];
        }
        
        rightmostFailuresExpected.push(failure);
      }
      
      function parse_templateLines() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1, pos2;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = [];
        result1 = parse_newline();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse_newline();
        }
        if (result0 !== null) {
          result1 = parse_line();
          result1 = result1 !== null ? result1 : "";
          if (result1 !== null) {
            result2 = [];
            pos2 = clone(pos);
            result4 = parse_newline();
            if (result4 !== null) {
              result3 = [];
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_newline();
              }
            } else {
              result3 = null;
            }
            if (result3 !== null) {
              result4 = parse_line();
              if (result4 !== null) {
                result3 = [result3, result4];
              } else {
                result3 = null;
                pos = clone(pos2);
              }
            } else {
              result3 = null;
              pos = clone(pos2);
            }
            while (result3 !== null) {
              result2.push(result3);
              pos2 = clone(pos);
              result4 = parse_newline();
              if (result4 !== null) {
                result3 = [];
                while (result4 !== null) {
                  result3.push(result4);
                  result4 = parse_newline();
                }
              } else {
                result3 = null;
              }
              if (result3 !== null) {
                result4 = parse_line();
                if (result4 !== null) {
                  result3 = [result3, result4];
                } else {
                  result3 = null;
                  pos = clone(pos2);
                }
              } else {
                result3 = null;
                pos = clone(pos2);
              }
            }
            if (result2 !== null) {
              result3 = [];
              result4 = parse_newline();
              while (result4 !== null) {
                result3.push(result4);
                result4 = parse_newline();
              }
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, first, tail) { return generateNodeTree(first, tail); })(pos0.offset, pos0.line, pos0.column, result0[1], result0[2]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_line() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = parse_indent();
        if (result0 !== null) {
          result1 = parse_element();
          if (result1 === null) {
            result1 = parse_textNode();
            if (result1 === null) {
              result1 = parse_directive();
            }
          }
          if (result1 !== null) {
            result2 = [];
            if (/^[ \t]/.test(input.charAt(pos.offset))) {
              result3 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result3 = null;
              if (reportFailures === 0) {
                matchFailed("[ \\t]");
              }
            }
            while (result3 !== null) {
              result2.push(result3);
              if (/^[ \t]/.test(input.charAt(pos.offset))) {
                result3 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[ \\t]");
                }
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, depth, s) { return { indent: depth, item: s, num: line }; })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse___() {
        var result0;
        
        reportFailures++;
        if (/^[ \t]/.test(input.charAt(pos.offset))) {
          result0 = input.charAt(pos.offset);
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[ \\t]");
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("whitespace");
        }
        return result0;
      }
      
      function parse_indent() {
        var result0, result1;
        var pos0;
        
        reportFailures++;
        pos0 = clone(pos);
        result0 = [];
        result1 = parse___();
        while (result1 !== null) {
          result0.push(result1);
          result1 = parse___();
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, s) { return parseIndent(s, line); })(pos0.offset, pos0.line, pos0.column, result0);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("indent");
        }
        return result0;
      }
      
      function parse_newline() {
        var result0;
        
        reportFailures++;
        if (input.charCodeAt(pos.offset) === 10) {
          result0 = "\n";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\n\"");
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("new line");
        }
        return result0;
      }
      
      function parse_character() {
        var result0;
        
        reportFailures++;
        if (/^[^\n]/.test(input.charAt(pos.offset))) {
          result0 = input.charAt(pos.offset);
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[^\\n]");
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("character");
        }
        return result0;
      }
      
      function parse_identifier() {
        var result0, result1, result2;
        var pos0, pos1;
        
        reportFailures++;
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (/^[a-z_]/i.test(input.charAt(pos.offset))) {
          result0 = input.charAt(pos.offset);
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("[a-z_]i");
          }
        }
        if (result0 !== null) {
          result1 = [];
          if (/^[a-z0-9_\-]/i.test(input.charAt(pos.offset))) {
            result2 = input.charAt(pos.offset);
            advance(pos, 1);
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("[a-z0-9_\\-]i");
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            if (/^[a-z0-9_\-]/i.test(input.charAt(pos.offset))) {
              result2 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[a-z0-9_\\-]i");
              }
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, h, t) { return h + t.join(''); })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("identifier");
        }
        return result0;
      }
      
      function parse_elemId() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 35) {
          result0 = "#";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"#\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_identifier();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, id) { return { 'id': id }; })(pos0.offset, pos0.line, pos0.column, result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_elemClass() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 46) {
          result0 = ".";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\".\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_identifier();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, cls) { return { 'className': cls }; })(pos0.offset, pos0.line, pos0.column, result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_elemAttribute() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 91) {
          result0 = "[";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"[\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_identifier();
          if (result1 !== null) {
            if (input.charCodeAt(pos.offset) === 61) {
              result2 = "=";
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"=\"");
              }
            }
            if (result2 !== null) {
              result3 = [];
              if (/^[^\n\]]/.test(input.charAt(pos.offset))) {
                result4 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result4 = null;
                if (reportFailures === 0) {
                  matchFailed("[^\\n\\]]");
                }
              }
              while (result4 !== null) {
                result3.push(result4);
                if (/^[^\n\]]/.test(input.charAt(pos.offset))) {
                  result4 = input.charAt(pos.offset);
                  advance(pos, 1);
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("[^\\n\\]]");
                  }
                }
              }
              if (result3 !== null) {
                if (input.charCodeAt(pos.offset) === 93) {
                  result4 = "]";
                  advance(pos, 1);
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("\"]\"");
                  }
                }
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = clone(pos1);
                }
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, attr, value) { return { 'attr': attr, 'value': value.join('') }; })(pos0.offset, pos0.line, pos0.column, result0[1], result0[3]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_elemProperty() {
        var result0, result1, result2, result3, result4, result5;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 91) {
          result0 = "[";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"[\"");
          }
        }
        if (result0 !== null) {
          if (input.charCodeAt(pos.offset) === 46) {
            result1 = ".";
            advance(pos, 1);
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("\".\"");
            }
          }
          if (result1 !== null) {
            result2 = parse_identifier();
            if (result2 !== null) {
              if (input.charCodeAt(pos.offset) === 61) {
                result3 = "=";
                advance(pos, 1);
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("\"=\"");
                }
              }
              if (result3 !== null) {
                result4 = [];
                if (/^[^\n\]]/.test(input.charAt(pos.offset))) {
                  result5 = input.charAt(pos.offset);
                  advance(pos, 1);
                } else {
                  result5 = null;
                  if (reportFailures === 0) {
                    matchFailed("[^\\n\\]]");
                  }
                }
                while (result5 !== null) {
                  result4.push(result5);
                  if (/^[^\n\]]/.test(input.charAt(pos.offset))) {
                    result5 = input.charAt(pos.offset);
                    advance(pos, 1);
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("[^\\n\\]]");
                    }
                  }
                }
                if (result4 !== null) {
                  if (input.charCodeAt(pos.offset) === 93) {
                    result5 = "]";
                    advance(pos, 1);
                  } else {
                    result5 = null;
                    if (reportFailures === 0) {
                      matchFailed("\"]\"");
                    }
                  }
                  if (result5 !== null) {
                    result0 = [result0, result1, result2, result3, result4, result5];
                  } else {
                    result0 = null;
                    pos = clone(pos1);
                  }
                } else {
                  result0 = null;
                  pos = clone(pos1);
                }
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, prop, value) { return { 'prop': prop, 'value': value.join('') }; })(pos0.offset, pos0.line, pos0.column, result0[2], result0[4]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_elemQualifier() {
        var result0;
        
        reportFailures++;
        result0 = parse_elemId();
        if (result0 === null) {
          result0 = parse_elemClass();
          if (result0 === null) {
            result0 = parse_elemAttribute();
            if (result0 === null) {
              result0 = parse_elemProperty();
            }
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("element qualifier");
        }
        return result0;
      }
      
      function parse_element() {
        var result0;
        
        reportFailures++;
        result0 = parse_implicitElement();
        if (result0 === null) {
          result0 = parse_explicitElement();
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("element");
        }
        return result0;
      }
      
      function parse_implicitElement() {
        var result0, result1;
        var pos0;
        
        pos0 = clone(pos);
        result1 = parse_elemQualifier();
        if (result1 !== null) {
          result0 = [];
          while (result1 !== null) {
            result0.push(result1);
            result1 = parse_elemQualifier();
          }
        } else {
          result0 = null;
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, qualifiers) { return createElement('div', qualifiers); })(pos0.offset, pos0.line, pos0.column, result0);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_explicitElement() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = parse_identifier();
        if (result0 !== null) {
          result1 = [];
          result2 = parse_elemQualifier();
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_elemQualifier();
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, tagName, qualifiers) { return createElement(tagName, qualifiers); })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_textNode() {
        var result0;
        var pos0;
        
        reportFailures++;
        pos0 = clone(pos);
        result0 = parse_quotedText();
        if (result0 !== null) {
          result0 = (function(offset, line, column, text) { return createTextNode(text); })(pos0.offset, pos0.line, pos0.column, result0);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("text node");
        }
        return result0;
      }
      
      function parse_contextPath() {
        var result0, result1, result2, result3;
        var pos0, pos1, pos2, pos3;
        
        reportFailures++;
        pos0 = clone(pos);
        pos1 = clone(pos);
        result0 = parse_identifier();
        if (result0 !== null) {
          result1 = [];
          pos2 = clone(pos);
          pos3 = clone(pos);
          if (input.charCodeAt(pos.offset) === 46) {
            result2 = ".";
            advance(pos, 1);
          } else {
            result2 = null;
            if (reportFailures === 0) {
              matchFailed("\".\"");
            }
          }
          if (result2 !== null) {
            result3 = parse_identifier();
            if (result3 !== null) {
              result2 = [result2, result3];
            } else {
              result2 = null;
              pos = clone(pos3);
            }
          } else {
            result2 = null;
            pos = clone(pos3);
          }
          if (result2 !== null) {
            result2 = (function(offset, line, column, i) { return i; })(pos2.offset, pos2.line, pos2.column, result2[1]);
          }
          if (result2 === null) {
            pos = clone(pos2);
          }
          while (result2 !== null) {
            result1.push(result2);
            pos2 = clone(pos);
            pos3 = clone(pos);
            if (input.charCodeAt(pos.offset) === 46) {
              result2 = ".";
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\".\"");
              }
            }
            if (result2 !== null) {
              result3 = parse_identifier();
              if (result3 !== null) {
                result2 = [result2, result3];
              } else {
                result2 = null;
                pos = clone(pos3);
              }
            } else {
              result2 = null;
              pos = clone(pos3);
            }
            if (result2 !== null) {
              result2 = (function(offset, line, column, i) { return i; })(pos2.offset, pos2.line, pos2.column, result2[1]);
            }
            if (result2 === null) {
              pos = clone(pos2);
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, first, tail) {
        	tail.unshift(first);
        	return tail.join('.');
        })(pos0.offset, pos0.line, pos0.column, result0[0], result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("context property path");
        }
        return result0;
      }
      
      function parse_escapedUnicode() {
        var result0, result1, result2, result3, result4;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 117) {
          result0 = "u";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"u\"");
          }
        }
        if (result0 !== null) {
          if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
            result1 = input.charAt(pos.offset);
            advance(pos, 1);
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[0-9a-z]i");
            }
          }
          if (result1 !== null) {
            if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
              result2 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[0-9a-z]i");
              }
            }
            if (result2 !== null) {
              if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
                result3 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result3 = null;
                if (reportFailures === 0) {
                  matchFailed("[0-9a-z]i");
                }
              }
              if (result3 !== null) {
                if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
                  result4 = input.charAt(pos.offset);
                  advance(pos, 1);
                } else {
                  result4 = null;
                  if (reportFailures === 0) {
                    matchFailed("[0-9a-z]i");
                  }
                }
                if (result4 !== null) {
                  result0 = [result0, result1, result2, result3, result4];
                } else {
                  result0 = null;
                  pos = clone(pos1);
                }
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, a, b, c, d) { return '' + a + b + c + d; })(pos0.offset, pos0.line, pos0.column, result0[1], result0[2], result0[3], result0[4]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_escapedASCII() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 120) {
          result0 = "x";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"x\"");
          }
        }
        if (result0 !== null) {
          if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
            result1 = input.charAt(pos.offset);
            advance(pos, 1);
          } else {
            result1 = null;
            if (reportFailures === 0) {
              matchFailed("[0-9a-z]i");
            }
          }
          if (result1 !== null) {
            if (/^[0-9a-z]/i.test(input.charAt(pos.offset))) {
              result2 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[0-9a-z]i");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, a, b) { return '' + a + b; })(pos0.offset, pos0.line, pos0.column, result0[1], result0[2]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_escapedCharacter() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 92) {
          result0 = "\\";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\\\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_escapedUnicode();
          if (result1 === null) {
            result1 = parse_escapedASCII();
            if (result1 === null) {
              result1 = parse_character();
            }
          }
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, c) { return escapedCharacter(c); })(pos0.offset, pos0.line, pos0.column, result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_doubleQuotedText() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 34) {
          result0 = "\"";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"\\\"\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_escapedCharacter();
          if (result2 === null) {
            if (/^[^\\\n"]/.test(input.charAt(pos.offset))) {
              result2 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[^\\\\\\n\"]");
              }
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_escapedCharacter();
            if (result2 === null) {
              if (/^[^\\\n"]/.test(input.charAt(pos.offset))) {
                result2 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[^\\\\\\n\"]");
                }
              }
            }
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos.offset) === 34) {
              result2 = "\"";
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"\\\"\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, chars) { return chars.join(''); })(pos0.offset, pos0.line, pos0.column, result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_singleQuotedText() {
        var result0, result1, result2;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 39) {
          result0 = "'";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"'\"");
          }
        }
        if (result0 !== null) {
          result1 = [];
          result2 = parse_escapedCharacter();
          if (result2 === null) {
            if (/^[^\\\n']/.test(input.charAt(pos.offset))) {
              result2 = input.charAt(pos.offset);
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("[^\\\\\\n']");
              }
            }
          }
          while (result2 !== null) {
            result1.push(result2);
            result2 = parse_escapedCharacter();
            if (result2 === null) {
              if (/^[^\\\n']/.test(input.charAt(pos.offset))) {
                result2 = input.charAt(pos.offset);
                advance(pos, 1);
              } else {
                result2 = null;
                if (reportFailures === 0) {
                  matchFailed("[^\\\\\\n']");
                }
              }
            }
          }
          if (result1 !== null) {
            if (input.charCodeAt(pos.offset) === 39) {
              result2 = "'";
              advance(pos, 1);
            } else {
              result2 = null;
              if (reportFailures === 0) {
                matchFailed("\"'\"");
              }
            }
            if (result2 !== null) {
              result0 = [result0, result1, result2];
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, chars) { return chars.join(''); })(pos0.offset, pos0.line, pos0.column, result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_quotedText() {
        var result0;
        
        reportFailures++;
        result0 = parse_doubleQuotedText();
        if (result0 === null) {
          result0 = parse_singleQuotedText();
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("quoted text");
        }
        return result0;
      }
      
      function parse_directive() {
        var result0;
        
        reportFailures++;
        result0 = parse_valueDirective();
        if (result0 === null) {
          result0 = parse_pathDirective();
          if (result0 === null) {
            result0 = parse_simpleDirective();
          }
        }
        reportFailures--;
        if (reportFailures === 0 && result0 === null) {
          matchFailed("directive");
        }
        return result0;
      }
      
      function parse_simpleDirective() {
        var result0, result1;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 64) {
          result0 = "@";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"@\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_identifier();
          if (result1 !== null) {
            result0 = [result0, result1];
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, name) { return createDirective(name); })(pos0.offset, pos0.line, pos0.column, result0[1]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_pathDirective() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 64) {
          result0 = "@";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"@\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_identifier();
          if (result1 !== null) {
            result2 = parse___();
            if (result2 !== null) {
              result3 = parse_contextPath();
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, name, path) { return createDirective(name, path); })(pos0.offset, pos0.line, pos0.column, result0[1], result0[3]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      function parse_valueDirective() {
        var result0, result1, result2, result3;
        var pos0, pos1;
        
        pos0 = clone(pos);
        pos1 = clone(pos);
        if (input.charCodeAt(pos.offset) === 64) {
          result0 = "@";
          advance(pos, 1);
        } else {
          result0 = null;
          if (reportFailures === 0) {
            matchFailed("\"@\"");
          }
        }
        if (result0 !== null) {
          result1 = parse_identifier();
          if (result1 !== null) {
            result2 = parse___();
            if (result2 !== null) {
              result3 = parse_quotedText();
              if (result3 !== null) {
                result0 = [result0, result1, result2, result3];
              } else {
                result0 = null;
                pos = clone(pos1);
              }
            } else {
              result0 = null;
              pos = clone(pos1);
            }
          } else {
            result0 = null;
            pos = clone(pos1);
          }
        } else {
          result0 = null;
          pos = clone(pos1);
        }
        if (result0 !== null) {
          result0 = (function(offset, line, column, name, value) { return createDirective(name, undefined, value); })(pos0.offset, pos0.line, pos0.column, result0[1], result0[3]);
        }
        if (result0 === null) {
          pos = clone(pos0);
        }
        return result0;
      }
      
      
      function cleanupExpected(expected) {
        expected.sort();
        
        var lastExpected = null;
        var cleanExpected = [];
        for (var i = 0; i < expected.length; i++) {
          if (expected[i] !== lastExpected) {
            cleanExpected.push(expected[i]);
            lastExpected = expected[i];
          }
        }
        return cleanExpected;
      }
      
      
      
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
      	createTextNode = function(text) {
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
      	createDirective = function(name, path, value) {
      		return new BlockNode(name, path, value);
      	};
      	
      	
      	escapedCharacter = function(char) {
      		if (char.length > 1) {
      			// 2 or 4 hex digits coming from \xNN or \uNNNN
      			return String.fromCharCode(parseInt(char, 16));
      		} else {
      			return { 'f': '\f', 'b': '\b', 't': '\t', 'n': '\n', 'r': '\r' }[char] || char;
      		}
      	};
      
      
      var result = parseFunctions[startRule]();
      
      /*
       * The parser is now in one of the following three states:
       *
       * 1. The parser successfully parsed the whole input.
       *
       *    - |result !== null|
       *    - |pos.offset === input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 2. The parser successfully parsed only a part of the input.
       *
       *    - |result !== null|
       *    - |pos.offset < input.length|
       *    - |rightmostFailuresExpected| may or may not contain something
       *
       * 3. The parser did not successfully parse any part of the input.
       *
       *   - |result === null|
       *   - |pos.offset === 0|
       *   - |rightmostFailuresExpected| contains at least one failure
       *
       * All code following this comment (including called functions) must
       * handle these states.
       */
      if (result === null || pos.offset !== input.length) {
        var offset = Math.max(pos.offset, rightmostFailuresPos.offset);
        var found = offset < input.length ? input.charAt(offset) : null;
        var errorPosition = pos.offset > rightmostFailuresPos.offset ? pos : rightmostFailuresPos;
        
        throw new this.SyntaxError(
          cleanupExpected(rightmostFailuresExpected),
          found,
          offset,
          errorPosition.line,
          errorPosition.column
        );
      }
      
      return result;
    },
    
    /* Returns the parser source code. */
    toSource: function() { return this._source; }
  };
  
  /* Thrown when a parser encounters a syntax error. */
  
  result.SyntaxError = function(expected, found, offset, line, column) {
    function buildMessage(expected, found) {
      var expectedHumanized, foundHumanized;
      
      switch (expected.length) {
        case 0:
          expectedHumanized = "end of input";
          break;
        case 1:
          expectedHumanized = expected[0];
          break;
        default:
          expectedHumanized = expected.slice(0, expected.length - 1).join(", ")
            + " or "
            + expected[expected.length - 1];
      }
      
      foundHumanized = found ? quote(found) : "end of input";
      
      return "Expected " + expectedHumanized + " but " + foundHumanized + " found.";
    }
    
    this.name = "SyntaxError";
    this.expected = expected;
    this.found = found;
    this.message = buildMessage(expected, found);
    this.offset = offset;
    this.line = line;
    this.column = column;
  };
  
  result.SyntaxError.prototype = Error.prototype;
  
  return result;
})();
	
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
