/**
 * IST: Indented Selector Templating
 * version 0.6.6
 *
 * Copyright (c) 2012-2014 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://njoyard.github.com/ist
 */
(function (global) {
 var isAMD = typeof global.define === 'function' && global.define.amd, isNode = typeof process !== 'undefined' && process.versions && !!process.versions.node, isBrowser = typeof window !== 'undefined' && window.navigator && window.document;
 var utilMisc = {
   jsEscape: function (content) {
    return content.replace(/(['\\])/g, '\\$1').replace(/[\f]/g, '\\f').replace(/[\b]/g, '\\b').replace(/[\t]/g, '\\t').replace(/[\n]/g, '\\n').replace(/[\r]/g, '\\r');
   },
   findScript: function (id) {
    var i, len, s, found, scripts;
    try {
     scripts = document.querySelectorAll('script#' + id);
    } catch (e) {
     return;
    }
    if (scripts) {
     for (i = 0, len = scripts.length; i < len; i++) {
      s = scripts[i];
      if (s.getAttribute('type') === 'text/x-ist') {
       return s.innerHTML;
      }
     }
    }
    return found;
   },
   iterateNodelist: function (firstChild, lastChild, callback) {
    var node = firstChild, end = lastChild ? lastChild.nextSibling : null, next;
    while (node && node !== end) {
     next = node.nextSibling;
     callback(node);
     node = next;
    }
   },
   buildNodelist: function (firstChild, lastChild) {
    var list = [];
    this.iterateNodelist(firstChild, lastChild, function (node) {
     list.push(node);
    });
    return list;
   },
   removeNodelist: function (firstChild, lastChild) {
    this.iterateNodelist(firstChild, lastChild, function (node) {
     node.parentNode.removeChild(node);
    });
   }
  };
 var componentsCodegen = function (misc) {
   
   var expressionRE = /{{\s*((?:}(?!})|[^}])*?)\s*}}/;
   var NL = '';
   var TAB = '';
   var indent;
   var interpolateCache = {};
   var propertyCache = {};
   if (TAB.length && NL.length) {
    indent = function (code) {
     if (Array.isArray(code)) {
      return code.map(indent);
     } else {
      return TAB + code.split(NL).join(NL + TAB);
     }
    };
   } else {
    indent = function (c) {
     return c;
    };
   }
   var codegen = {
     evaluate: function (expr) {
      var cacheKey = '{{ ' + expr + ' }}';
      if (!(cacheKey in interpolateCache)) {
       var code = [
         TAB + 'if(this!==null&&this!==undefined){',
         TAB + TAB + 'with(this){with(ist$s){return ' + expr + ';}}',
         TAB + '}else{',
         TAB + TAB + 'with(ist$s){return ' + expr + ';}',
         TAB + '}'
        ].join(NL);
       var args = 'document,ist$s';
       new Function(args, code);
       interpolateCache[cacheKey] = [
        'ist$x.call(function(' + args + '){',
        code,
        '})'
       ].join(NL);
      }
      return interpolateCache[cacheKey];
     },
     interpolate: function (text) {
      if (!(text in interpolateCache)) {
       if (expressionRE.test(text)) {
        interpolateCache[text] = codegen.evaluate(text.split(expressionRE).map(function (part, index) {
         if (index % 2) {
          return '(' + part + ')';
         } else {
          return '\'' + misc.jsEscape(part) + '\'';
         }
        }).filter(function (part) {
         return part !== '\'\'';
        }).join('+'));
       } else {
        interpolateCache[text] = '\'' + misc.jsEscape(text) + '\'';
       }
      }
      return interpolateCache[text];
     },
     property: function prout(path) {
      var cacheKey = path.join('.');
      if (!(cacheKey in propertyCache)) {
       propertyCache[cacheKey] = [
        'function(ist$t,ist$v) {',
        TAB + 'var ist$c = ist$t;'
       ].concat(indent(path.map(function (part, index) {
        if (index === path.length - 1) {
         return 'ist$c["' + part + '"] = ist$v;';
        } else {
         return 'ist$c = ist$c["' + part + '"] = ist$c["' + part + '"] || {};';
        }
       }))).concat(['}']).join(NL);
      }
      return propertyCache[cacheKey];
     },
     line: function (node) {
      return 'ist$i = ' + node.line + ';';
     },
     element: function (node) {
      var attributes = node.attributes || {};
      var properties = node.properties || [];
      var events = node.events || {};
      return [codegen.line(node)].concat(Object.keys(attributes).map(function (attr) {
       return [
        'ist$n.setAttribute(',
        TAB + '"' + attr + '",',
        TAB + '"" + ' + codegen.interpolate(attributes[attr]),
        ');'
       ].join(NL);
      })).concat(properties.map(function (prop) {
       return '(' + codegen.property(prop.path) + ')(ist$n, ' + codegen.interpolate(prop.value) + ');';
      })).concat([
       'ist$n.ist$handlers = ist$n.ist$handlers || {};',
       'Object.keys(ist$n.ist$handlers).forEach(function(evt) {',
       TAB + 'ist$n.removeEventListener(evt, ist$n.ist$handlers[evt], false);',
       TAB + 'delete ist$n.ist$handlers[evt];',
       '});'
      ]).concat(Object.keys(events).map(function (evt) {
       return ['ist$n.ist$handlers["' + evt + '"] = ' + codegen.evaluate(events[evt]) + ';'].join(NL);
      })).concat([
       'Object.keys(ist$n.ist$handlers).forEach(function(evt) {',
       TAB + 'ist$n.addEventListener(evt, ist$n.ist$handlers[evt], false);',
       '});'
      ]).join(NL);
     },
     text: function (node) {
      return [
       codegen.line(node),
       'ist$n.textContent = "" + ' + codegen.interpolate(node.text) + ';'
      ].join(NL);
     },
     directive: function (node) {
      var evalExpr = node.expr ? codegen.evaluate(node.expr) : 'undefined';
      return [
       codegen.line(node),
       'if (!("keys" in ist$n)) {',
       TAB + 'ist$n.keys = [];',
       TAB + 'ist$n.fragments = [];',
       '} else {',
       TAB + 'ist$n.remove(ist$l);',
       '}',
       'if (!ist$d.has("' + node.directive + '")) {',
       TAB + 'throw new Error("No directive helper for @' + node.directive + ' has been registered");',
       '}',
       'ist$d.get("' + node.directive + '")(ist$x, ' + evalExpr + ', ist$n.template, ist$n.iterator);',
       'ist$n = ist$n.last() || ist$n;'
      ].join(NL);
     },
     children: function (code) {
      return ['(function(ist$l) {'].concat(indent(code)).concat(['})([].slice.call(ist$n.childNodes));']).join(NL);
     },
     next: function () {
      return ['ist$n = ist$l.shift();'].join(NL);
     },
     wrap: function (code) {
      return [
       'var ist$n;',
       'var ist$i;',
       'try {'
      ].concat(indent(code)).concat([
       TAB + 'return ist$n;',
       '} catch(e) {',
       TAB + 'throw ist$e(e, ist$i);',
       '}'
      ]).join(NL);
     },
     compile: function (code) {
      return new Function('ist$e,ist$d,ist$x,ist$l', Array.isArray(code) ? code.join(NL) : code);
     }
    };
   return codegen;
  }(utilMisc);
 var componentsIterator = function (misc) {
   
   function iterator(markerComment, keys, callback) {
    var keyIndex = markerComment.keys;
    var fragIndex = markerComment.fragments;
    if (typeof keys === 'function') {
     callback = keys;
     keys = ['nokey'];
    }
    for (var i = 0; i < keyIndex.length; i++) {
     if (keys.indexOf(keyIndex[i]) === -1) {
      var frag = fragIndex[i];
      misc.removeNodelist(frag.firstChild, frag.lastChild);
      keyIndex.splice(i, 1);
      fragIndex.splice(i, 1);
      i--;
     }
    }
    var prev = markerComment;
    keys.forEach(function (key, i) {
     var idx = keyIndex.indexOf(key);
     var ret;
     var frag;
     var next;
     var rendered;
     var isNew = false;
     if (idx !== -1) {
      frag = fragIndex[idx];
      var node = frag.firstChild;
      if (node && node.previousSibling !== prev) {
       next = prev.nextSibling;
       misc.iterateNodelist(node, frag.lastChild, function (node) {
        prev.parentNode.insertBefore(node, next);
       });
      }
      rendered = frag.rendered;
      if (rendered) {
       rendered.clear = function () {
        misc.removeNodelist(frag.firstChild, frag.lastChild);
        frag.firstChild = frag.lastChild = null;
       };
       rendered.reclaim = function (parent) {
        misc.iterateNodelist(frag.firstChild, frag.lastChild, function (node) {
         parent.appendChild(node);
        });
       };
      }
     } else {
      frag = {};
     }
     ret = callback(key, rendered);
     if (idx !== i) {
      if (idx !== -1) {
       keyIndex.splice(idx, 1);
       fragIndex.splice(idx, 1);
      }
      keyIndex.splice(i, 0, key);
      fragIndex.splice(i, 0, frag);
     }
     if (ret) {
      if ('nodeType' in ret) {
       if (rendered && ret !== rendered) {
        rendered.clear();
       }
       isNew = true;
       rendered = ret;
      } else {
       throw new Error('Helper iterator callback returned unknown result');
      }
     }
     if (rendered) {
      if (rendered.nodeType === rendered.DOCUMENT_FRAGMENT_NODE) {
       frag.firstChild = typeof rendered._first === 'function' ? rendered._first() : rendered.firstChild;
       frag.lastChild = typeof rendered._last === 'function' ? rendered._last() : rendered.lastChild;
      } else {
       frag.firstChild = frag.lastChild = rendered;
      }
      frag.rendered = rendered;
      if (isNew) {
       next = prev.nextSibling;
       misc.iterateNodelist(frag.firstChild, frag.lastChild, function (node) {
        prev.parentNode.insertBefore(node, next);
       });
      }
     } else {
      delete frag.rendered;
      frag.firstChild = frag.lastChild = null;
     }
     prev = frag.lastChild || prev;
    });
   }
   iterator.remove = function (markerComment, list) {
    var fragIndex = markerComment.fragments;
    if (fragIndex) {
     fragIndex.forEach(function (frag) {
      misc.iterateNodelist(frag.firstChild, frag.lastChild, function (node) {
       var idx = list.indexOf(node);
       if (idx !== -1) {
        list.splice(idx, 1);
       }
      });
     });
    }
   };
   iterator.last = function (markerComment) {
    var fragIndex = markerComment.fragments;
    if (fragIndex && fragIndex.length) {
     for (var i = fragIndex.length - 1; i >= 0; i--) {
      if (fragIndex[i].lastChild) {
       return fragIndex[i].lastChild;
      }
     }
    }
   };
   return iterator;
  }(utilMisc);
 var componentsContext = function (iterator) {
   
   function Context(object, doc) {
    this.value = object;
    this.values = [object];
    this.doc = doc || document;
    this.rootScope = this.scope = Context.globalScope;
   }
   Context.globalScope = {};
   Context.prototype = {
    clonePrerendered: function (node) {
     var clone = this.importNode(node, false);
     if (node.nodeType === node.COMMENT_NODE) {
      clone.iterator = function (keys, callback) {
       return iterator(clone, keys, callback);
      };
      clone.last = function () {
       return iterator.last(clone);
      };
      clone.remove = function (list) {
       return iterator.remove(clone, list);
      };
      clone.template = node.template;
     }
     var self = this;
     if (node.childNodes) {
      [].slice.call(node.childNodes).forEach(function (child) {
       clone.appendChild(self.clonePrerendered(child));
      });
     }
     return clone;
    },
    importNode: function (node, deep) {
     if (node.ownerDocument === this.doc) {
      return node.cloneNode(deep);
     } else {
      return this.doc.importNode(node, deep);
     }
    },
    createDocumentFragment: function () {
     return this.doc.createDocumentFragment();
    },
    createElement: function (tagName, namespace) {
     if (typeof namespace !== 'undefined') {
      return this.doc.createElementNS(namespace, tagName);
     } else {
      return this.doc.createElement(tagName);
     }
    },
    createTextNode: function (text) {
     return this.doc.createTextNode(text);
    },
    createComment: function (comment) {
     return this.doc.createComment(comment);
    },
    pushScope: function (scope) {
     var newScope = Object.create(this.scope);
     Object.keys(scope).forEach(function (key) {
      newScope[key] = scope[key];
     });
     this.scope = newScope;
    },
    popScope: function () {
     var thisScope = this.scope;
     if (thisScope === this.rootScope) {
      throw new Error('No scope left to pop out');
     }
     this.scope = Object.getPrototypeOf(thisScope);
    },
    pushValue: function (value) {
     this.values.unshift(value);
     this.value = value;
     if (value !== undefined && value !== null && typeof value !== 'string' && typeof value !== 'number') {
      this.pushScope(value);
     } else {
      this.pushScope({});
     }
    },
    popValue: function () {
     this.popScope();
     this.values.shift();
     this.value = this.values[0];
    },
    createContext: function (newValue) {
     return new Context(newValue, this.doc);
    },
    call: function (fn) {
     return fn.call(this.value, this.doc, this.scope);
    }
   };
   return Context;
  }(componentsIterator);
 var componentsDirectives = function () {
   
   var directives, registered, defined = {};
   function conditionalHelper(ctx, render, tmpl, iterate) {
    iterate(render ? ['conditional'] : [], function (key, rendered) {
     if (rendered) {
      rendered.update(ctx);
     } else {
      return tmpl.render(ctx);
     }
    });
   }
   function iterationHelper(ctx, items, keys, loopAdd, tmpl, iterate) {
    var outerValue = ctx.value;
    iterate(keys, function (key, rendered) {
     var index = keys.indexOf(key);
     var item = items[keys.indexOf(key)];
     ctx.pushValue(item);
     var loop = {
       first: index === 0,
       index: index,
       last: index == items.length - 1,
       length: items.length,
       outer: outerValue
      };
     if (loopAdd) {
      Object.keys(loopAdd).forEach(function (key) {
       loop[key] = loopAdd[key];
      });
     }
     ctx.pushScope({ loop: loop });
     if (rendered) {
      rendered.update(ctx);
     } else {
      rendered = tmpl.render(ctx);
     }
     ctx.popScope();
     ctx.popValue();
     return rendered;
    });
   }
   registered = {
    'if': function ifHelper(ctx, value, tmpl, iterate) {
     conditionalHelper(ctx, value, tmpl, iterate);
    },
    'unless': function unlessHelper(ctx, value, tmpl, iterate) {
     conditionalHelper(ctx, !value, tmpl, iterate);
    },
    'with': function withHelper(ctx, value, tmpl, iterate) {
     iterate(function (key, rendered) {
      ctx.pushValue(value);
      if (rendered) {
       rendered.update(ctx);
      } else {
       rendered = tmpl.render(ctx);
      }
      ctx.popValue();
      return rendered;
     });
    },
    'each': function eachHelper(ctx, value, tmpl, iterate) {
     if (!Array.isArray(value)) {
      throw new Error(value + ' is not an array');
     }
     iterationHelper(ctx, value, value, null, tmpl, iterate);
    },
    'eachkey': function eachkeyHelper(ctx, value, tmpl, iterate) {
     var keys = Object.keys(value);
     var array = keys.map(function (key) {
       return {
        key: key,
        value: value[key]
       };
      });
     iterationHelper(ctx, array, keys, { object: value }, tmpl, iterate);
    },
    'dom': function domHelper(ctx, value, tmpl, iterate) {
     iterate(function () {
      if (value.ownerDocument !== ctx.doc) {
       value = ctx.doc.importNode(value, true);
      }
      return value;
     });
    },
    'define': function defineHelper(ctx, value, tmpl) {
     defined[value] = tmpl;
    },
    'use': function useHelper(ctx, value, tmpl, iterate) {
     if (!(value in defined)) {
      throw new Error('Template \'' + value + '\' has not been @defined');
     }
     iterate(function (key, rendered) {
      if (rendered) {
       rendered.update(ctx);
      } else {
       return defined[value].render(ctx);
      }
     });
    }
   };
   directives = {
    register: function registerDirective(name, helper) {
     registered[name] = helper;
    },
    has: function hasDirective(name) {
     return name in registered && typeof registered[name] === 'function';
    },
    get: function getDirective(name) {
     return registered[name];
    }
   };
   return directives;
  }();
 var componentsTemplate = function (codegen, Context, directives, misc) {
   
   var expressionRE = /{{((?:}(?!})|[^}])*)}}/;
   function findPartialRec(name, nodes) {
    var found, i, len, results = nodes.filter(function (n) {
      return n.partial === name;
     });
    if (results.length) {
     return results[0];
    }
    for (i = 0, len = nodes.length; i < len; i++) {
     if (typeof nodes[i].children !== 'undefined') {
      found = findPartialRec(name, nodes[i].children);
      if (found) {
       return found;
      }
     }
    }
   }
   function Template(name, nodes) {
    this.name = name || '<unknown>';
    this.nodes = nodes;
    if (typeof document !== 'undefined') {
     this.pre = document.createDocumentFragment();
     this.update = codegen.compile(this._preRenderTree(nodes, this.pre));
    }
   }
   Template.prototype._preRenderTree = function (templateNodes, parent) {
    var code = [];
    var self = this;
    templateNodes.forEach(function (templateNode) {
     var node;
     code.push(codegen.next());
     try {
      if ('tagName' in templateNode) {
       node = document.createElement(templateNode.tagName);
       (templateNode.classes || []).forEach(function (cls) {
        node.classList.add(cls);
       });
       if (typeof templateNode.id !== 'undefined') {
        node.id = templateNode.id;
       }
       code.push(codegen.element(templateNode));
       if (templateNode.children && templateNode.children.length) {
        code = code.concat(codegen.children(self._preRenderTree(templateNode.children, node)));
       }
      } else if ('text' in templateNode) {
       node = document.createTextNode(templateNode.text);
       if (expressionRE.test(templateNode.text)) {
        code.push(codegen.text(templateNode));
       }
      } else if ('directive' in templateNode) {
       node = document.createComment('@' + templateNode.directive + ' ' + templateNode.expr + ' (' + self.name + ':' + templateNode.line + ')');
       if (templateNode.children && templateNode.children.length) {
        node.template = new Template(self.name, templateNode.children);
       }
       code.push(codegen.directive(templateNode));
      }
      parent.appendChild(node);
     } catch (e) {
      throw self._completeError(e, templateNode.line);
     }
    });
    return codegen.wrap(code);
   };
   Template.prototype.findPartial = function (name) {
    if (console)
     (console.warn || console.log)('Warning: Template#findPartial is deprecated, use Template#partial instead');
    return this.partial(name);
   };
   Template.prototype.partial = function (name) {
    var result;
    if (typeof name === 'undefined') {
     return;
    }
    result = findPartialRec(name, this.nodes);
    if (result) {
     return new Template(this.name, [result]);
    }
   };
   Template.prototype._completeError = function (err, line) {
    var current = 'in \'' + this.name + '\' on line ' + (line || '<unknown>');
    if (typeof err.istStack === 'undefined') {
     err.message += ' ' + current;
     err.istStack = [];
    }
    err.istStack.push(current);
    return err;
   };
   Template.prototype.render = function (context, doc) {
    var self = this;
    function getContext(ctx, doc) {
     if (ctx instanceof Context) {
      return ctx;
     } else {
      return new Context(ctx, doc || document);
     }
    }
    context = getContext(context, doc);
    var fragment = context.clonePrerendered(this.pre);
    var firstNode = fragment.firstChild;
    var lastNode = fragment.lastChild;
    fragment.update = function (ctx) {
     ctx = getContext(ctx || context);
     lastNode = self.update(function (err, line) {
      return self._completeError(err, line);
     }, directives, ctx, misc.buildNodelist(firstNode, lastNode));
    };
    fragment._first = function () {
     return firstNode;
    };
    fragment._last = function () {
     return lastNode;
    };
    fragment.update(context);
    return fragment;
   };
   return Template;
  }(componentsCodegen, componentsContext, componentsDirectives, utilMisc);
 var parserParsehelpers = function () {
   
   var UNCHANGED = 'U', INDENT = 'I', DEDENT = 'D', textToJSON, elemToJSON, directiveToJSON, helpers = {};
   textToJSON = function () {
    return {
     text: this.text,
     line: this.line
    };
   };
   elemToJSON = function () {
    var o = {
      tagName: this.tagName,
      line: this.line
     };
    if (typeof this.id !== 'undefined') {
     o.id = this.id;
    }
    if (typeof this.classes !== 'undefined' && this.classes.length > 0) {
     o.classes = this.classes;
    }
    if (typeof this.attributes !== 'undefined' && Object.keys(this.attributes).length > 0) {
     o.attributes = this.attributes;
    }
    if (typeof this.properties !== 'undefined' && this.properties.length > 0) {
     o.properties = this.properties;
    }
    if (typeof this.events !== 'undefined' && Object.keys(this.events).length > 0) {
     o.events = this.events;
    }
    if (typeof this.children !== 'undefined' && this.children.length > 0) {
     o.children = this.children;
    }
    if (typeof this.partial !== 'undefined') {
     o.partial = this.partial;
    }
    return o;
   };
   directiveToJSON = function () {
    var o = {
      directive: this.directive,
      expr: this.expr,
      line: this.line
     };
    if (typeof this.children !== 'undefined' && this.children.length > 0) {
     o.children = this.children;
    }
    return o;
   };
   helpers.generateNodeTree = function (first, tail) {
    var root = { children: [] }, stack = [root], nodeCount = 0, lines, peekNode, pushNode, popNode;
    if (!first) {
     return root.children;
    }
    peekNode = function () {
     return stack[stack.length - 1];
    };
    pushNode = function (node) {
     nodeCount++;
     stack.push(node);
    };
    popNode = function () {
     var node, parent, err;
     if (stack.length < 2) {
      throw new Error('Could not pop node from stack');
     }
     node = stack.pop();
     parent = peekNode();
     if (typeof parent.text !== 'undefined') {
      err = new Error('Cannot add children to text node');
      err.line = node.line;
      throw err;
     }
     if (node.directive === 'else') {
      var prev = parent.children[parent.children.length - 1];
      if (prev && !prev.wasElse && prev.directive === 'if') {
       node.directive = 'unless';
      } else if (prev && !prev.wasElse && prev.directive === 'unless') {
       node.directive = 'if';
      } else {
       err = new Error('@else directive has no matching @if or @unless directive');
       err.line = node.line;
       throw err;
      }
      node.expr = prev.expr;
      node.wasElse = true;
     }
     parent.children.push(node);
     return node;
    };
    lines = tail.map(function (item) {
     return item.pop();
    });
    lines.unshift(first);
    lines.forEach(function (line) {
     var indent = line.indent, item = line.item;
     if (indent[0] instanceof Error) {
      throw indent[0];
     }
     if (nodeCount > 0) {
      if (indent[0] === UNCHANGED) {
       popNode();
      } else if (indent[0] === DEDENT) {
       popNode();
       while (indent.length > 0) {
        indent.pop();
        popNode();
       }
      }
     }
     pushNode(item);
    });
    while (stack.length > 1) {
     popNode();
    }
    return root.children;
   };
   helpers.parseIndent = function (depths, s, line) {
    var depth = s.length, dents = [], err;
    if (depth.length === 0) {
     depths.push(depth);
    }
    if (depth == depths[0]) {
     return [UNCHANGED];
    }
    if (depth > depths[0]) {
     depths.unshift(depth);
     return [INDENT];
    }
    while (depth < depths[0]) {
     depths.shift();
     dents.push(DEDENT);
    }
    if (depth != depths[0]) {
     err = new Error('Unexpected indent');
     err.line = line;
     err.column = 1;
     return [err];
    }
    return dents;
   };
   helpers.createTextNode = function (text, line) {
    return {
     text: text,
     line: line,
     toJSON: textToJSON
    };
   };
   helpers.createElement = function (tagName, qualifiers, additions, line) {
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
    qualifiers.forEach(function (q) {
     if (typeof q.id !== 'undefined') {
      elem.id = q.id;
     } else if (typeof q.className !== 'undefined') {
      elem.classes.push(q.className);
     } else if (typeof q.attr !== 'undefined') {
      elem.attributes[q.attr] = q.value;
     } else if (typeof q.prop !== 'undefined') {
      elem.properties.push({
       path: q.prop,
       value: q.value
      });
     } else if (typeof q.event !== 'undefined') {
      if (typeof elem.events[q.event] === 'undefined') {
       elem.events[q.event] = [];
      }
      elem.events[q.event].push(q.value);
     }
    });
    if (typeof additions !== 'undefined') {
     if (additions.partial) {
      elem.partial = additions.partial;
     }
     if (additions.textnode && typeof additions.textnode.text !== 'undefined') {
      elem.children.push(additions.textnode);
     }
    }
    return elem;
   };
   helpers.createDirective = function (name, expr, line) {
    return {
     directive: name,
     expr: expr,
     line: line,
     children: [],
     toJSON: directiveToJSON
    };
   };
   helpers.escapedCharacter = function (char) {
    if (char.length > 1) {
     return String.fromCharCode(parseInt(char, 16));
    } else {
     return {
      'f': '\f',
      'b': '\b',
      't': '\t',
      'n': '\n',
      'r': '\r'
     }[char] || char;
    }
   };
   return helpers;
  }();
 var parserParser = function (helpers) {
   var pegjsParser;
   pegjsParser = function () {
    function peg$subclass(child, parent) {
     function ctor() {
      this.constructor = child;
     }
     ctor.prototype = parent.prototype;
     child.prototype = new ctor();
    }
    function SyntaxError(message, expected, found, offset, line, column) {
     this.message = message;
     this.expected = expected;
     this.found = found;
     this.offset = offset;
     this.line = line;
     this.column = column;
     this.name = 'SyntaxError';
    }
    peg$subclass(SyntaxError, Error);
    function parse(input) {
     var options = arguments.length > 1 ? arguments[1] : {}, peg$FAILED = {}, peg$startRuleFunctions = { templateLines: peg$parsetemplateLines }, peg$startRuleFunction = peg$parsetemplateLines, peg$c0 = peg$FAILED, peg$c1 = [], peg$c2 = null, peg$c3 = function (first, tail) {
       return helpers.generateNodeTree(first, tail);
      }, peg$c4 = {
       type: 'other',
       description: 'whitespace'
      }, peg$c5 = /^[ \t]/, peg$c6 = {
       type: 'class',
       value: '[ \\t]',
       description: '[ \\t]'
      }, peg$c7 = function (depth, s) {
       return {
        indent: depth,
        item: s
       };
      }, peg$c8 = {
       type: 'other',
       description: 'indent'
      }, peg$c9 = function (s) {
       return helpers.parseIndent(depths, s, line());
      }, peg$c10 = {
       type: 'other',
       description: 'new line'
      }, peg$c11 = '\n', peg$c12 = {
       type: 'literal',
       value: '\n',
       description: '"\\n"'
      }, peg$c13 = {
       type: 'other',
       description: 'character'
      }, peg$c14 = /^[^\n]/, peg$c15 = {
       type: 'class',
       value: '[^\\n]',
       description: '[^\\n]'
      }, peg$c16 = {
       type: 'other',
       description: 'identifier'
      }, peg$c17 = /^[a-z_]/i, peg$c18 = {
       type: 'class',
       value: '[a-z_]i',
       description: '[a-z_]i'
      }, peg$c19 = /^[a-z0-9_\-]/i, peg$c20 = {
       type: 'class',
       value: '[a-z0-9_\\-]i',
       description: '[a-z0-9_\\-]i'
      }, peg$c21 = function (h, t) {
       return h + t.join('');
      }, peg$c22 = {
       type: 'other',
       description: 'dotted path'
      }, peg$c23 = '.', peg$c24 = {
       type: 'literal',
       value: '.',
       description: '"."'
      }, peg$c25 = function (h, t) {
       return t.length ? [h].concat(t.map(function (i) {
        return i[1];
       })) : [h];
      }, peg$c26 = '!', peg$c27 = {
       type: 'literal',
       value: '!',
       description: '"!"'
      }, peg$c28 = function (name) {
       return name;
      }, peg$c29 = '#', peg$c30 = {
       type: 'literal',
       value: '#',
       description: '"#"'
      }, peg$c31 = function (id) {
       return { 'id': id };
      }, peg$c32 = function (cls) {
       return { 'className': cls };
      }, peg$c33 = /^[^\\\n\]]/, peg$c34 = {
       type: 'class',
       value: '[^\\\\\\n\\]]',
       description: '[^\\\\\\n\\]]'
      }, peg$c35 = function (chars) {
       return chars.join('');
      }, peg$c36 = '[', peg$c37 = {
       type: 'literal',
       value: '[',
       description: '"["'
      }, peg$c38 = '=', peg$c39 = {
       type: 'literal',
       value: '=',
       description: '"="'
      }, peg$c40 = ']', peg$c41 = {
       type: 'literal',
       value: ']',
       description: '"]"'
      }, peg$c42 = function (attr, value) {
       return {
        'attr': attr,
        'value': value
       };
      }, peg$c43 = function (prop, value) {
       return {
        'prop': prop,
        'value': value
       };
      }, peg$c44 = function (event, value) {
       return {
        'event': event,
        'value': value
       };
      }, peg$c45 = {
       type: 'other',
       description: 'element qualifier'
      }, peg$c46 = {
       type: 'other',
       description: 'element'
      }, peg$c47 = function (qualifiers, additions) {
       return helpers.createElement('div', qualifiers, additions, line());
      }, peg$c48 = function (tagName, qualifiers, additions) {
       return helpers.createElement(tagName, qualifiers, additions, line());
      }, peg$c49 = function (t) {
       return t;
      }, peg$c50 = function (p) {
       return p;
      }, peg$c51 = function (t, p) {
       return {
        textnode: t,
        partial: p
       };
      }, peg$c52 = {
       type: 'other',
       description: 'text node'
      }, peg$c53 = function (text) {
       return helpers.createTextNode(text, line());
      }, peg$c54 = 'u', peg$c55 = {
       type: 'literal',
       value: 'u',
       description: '"u"'
      }, peg$c56 = /^[0-9a-z]/i, peg$c57 = {
       type: 'class',
       value: '[0-9a-z]i',
       description: '[0-9a-z]i'
      }, peg$c58 = function (a, b, c, d) {
       return '' + a + b + c + d;
      }, peg$c59 = 'x', peg$c60 = {
       type: 'literal',
       value: 'x',
       description: '"x"'
      }, peg$c61 = function (a, b) {
       return '' + a + b;
      }, peg$c62 = '\\', peg$c63 = {
       type: 'literal',
       value: '\\',
       description: '"\\\\"'
      }, peg$c64 = function (c) {
       return helpers.escapedCharacter(c);
      }, peg$c65 = '"', peg$c66 = {
       type: 'literal',
       value: '"',
       description: '"\\""'
      }, peg$c67 = /^[^\\\n"]/, peg$c68 = {
       type: 'class',
       value: '[^\\\\\\n"]',
       description: '[^\\\\\\n"]'
      }, peg$c69 = '\'', peg$c70 = {
       type: 'literal',
       value: '\'',
       description: '"\'"'
      }, peg$c71 = /^[^\\\n']/, peg$c72 = {
       type: 'class',
       value: '[^\\\\\\n\']',
       description: '[^\\\\\\n\']'
      }, peg$c73 = {
       type: 'other',
       description: 'quoted text'
      }, peg$c74 = {
       type: 'other',
       description: 'directive'
      }, peg$c75 = '@', peg$c76 = {
       type: 'literal',
       value: '@',
       description: '"@"'
      }, peg$c77 = function (name) {
       return helpers.createDirective(name, undefined, line());
      }, peg$c78 = function (name, expr) {
       return helpers.createDirective(name, expr.join(''), line());
      }, peg$currPos = 0, peg$reportedPos = 0, peg$cachedPos = 0, peg$cachedPosDetails = {
       line: 1,
       column: 1,
       seenCR: false
      }, peg$maxFailPos = 0, peg$maxFailExpected = [], peg$silentFails = 0, peg$result;
     if ('startRule' in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
       throw new Error('Can\'t start parsing from rule "' + options.startRule + '".');
      }
      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
     }
     function text() {
      return input.substring(peg$reportedPos, peg$currPos);
     }
     function offset() {
      return peg$reportedPos;
     }
     function line() {
      return peg$computePosDetails(peg$reportedPos).line;
     }
     function column() {
      return peg$computePosDetails(peg$reportedPos).column;
     }
     function expected(description) {
      throw peg$buildException(null, [{
        type: 'other',
        description: description
       }], peg$reportedPos);
     }
     function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
     }
     function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
       var p, ch;
       for (p = startPos; p < endPos; p++) {
        ch = input.charAt(p);
        if (ch === '\n') {
         if (!details.seenCR) {
          details.line++;
         }
         details.column = 1;
         details.seenCR = false;
        } else if (ch === '\r' || ch === '\u2028' || ch === '\u2029') {
         details.line++;
         details.column = 1;
         details.seenCR = true;
        } else {
         details.column++;
         details.seenCR = false;
        }
       }
      }
      if (peg$cachedPos !== pos) {
       if (peg$cachedPos > pos) {
        peg$cachedPos = 0;
        peg$cachedPosDetails = {
         line: 1,
         column: 1,
         seenCR: false
        };
       }
       advance(peg$cachedPosDetails, peg$cachedPos, pos);
       peg$cachedPos = pos;
      }
      return peg$cachedPosDetails;
     }
     function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) {
       return;
      }
      if (peg$currPos > peg$maxFailPos) {
       peg$maxFailPos = peg$currPos;
       peg$maxFailExpected = [];
      }
      peg$maxFailExpected.push(expected);
     }
     function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
       var i = 1;
       expected.sort(function (a, b) {
        if (a.description < b.description) {
         return -1;
        } else if (a.description > b.description) {
         return 1;
        } else {
         return 0;
        }
       });
       while (i < expected.length) {
        if (expected[i - 1] === expected[i]) {
         expected.splice(i, 1);
        } else {
         i++;
        }
       }
      }
      function buildMessage(expected, found) {
       function stringEscape(s) {
        function hex(ch) {
         return ch.charCodeAt(0).toString(16).toUpperCase();
        }
        return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\x08/g, '\\b').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\f/g, '\\f').replace(/\r/g, '\\r').replace(/[\x00-\x07\x0B\x0E\x0F]/g, function (ch) {
         return '\\x0' + hex(ch);
        }).replace(/[\x10-\x1F\x80-\xFF]/g, function (ch) {
         return '\\x' + hex(ch);
        }).replace(/[\u0180-\u0FFF]/g, function (ch) {
         return '\\u0' + hex(ch);
        }).replace(/[\u1080-\uFFFF]/g, function (ch) {
         return '\\u' + hex(ch);
        });
       }
       var expectedDescs = new Array(expected.length), expectedDesc, foundDesc, i;
       for (i = 0; i < expected.length; i++) {
        expectedDescs[i] = expected[i].description;
       }
       expectedDesc = expected.length > 1 ? expectedDescs.slice(0, -1).join(', ') + ' or ' + expectedDescs[expected.length - 1] : expectedDescs[0];
       foundDesc = found ? '"' + stringEscape(found) + '"' : 'end of input';
       return 'Expected ' + expectedDesc + ' but ' + foundDesc + ' found.';
      }
      var posDetails = peg$computePosDetails(pos), found = pos < input.length ? input.charAt(pos) : null;
      if (expected !== null) {
       cleanupExpected(expected);
      }
      return new SyntaxError(message !== null ? message : buildMessage(expected, found), expected, found, pos, posDetails.line, posDetails.column);
     }
     function peg$parsetemplateLines() {
      var s0, s1, s2, s3, s4, s5, s6;
      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsenewline();
      while (s2 !== peg$FAILED) {
       s1.push(s2);
       s2 = peg$parsenewline();
      }
      if (s1 !== peg$FAILED) {
       s2 = peg$parseline();
       if (s2 === peg$FAILED) {
        s2 = peg$c2;
       }
       if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$currPos;
        s5 = [];
        s6 = peg$parsenewline();
        if (s6 !== peg$FAILED) {
         while (s6 !== peg$FAILED) {
          s5.push(s6);
          s6 = peg$parsenewline();
         }
        } else {
         s5 = peg$c0;
        }
        if (s5 !== peg$FAILED) {
         s6 = peg$parseline();
         if (s6 !== peg$FAILED) {
          s5 = [
           s5,
           s6
          ];
          s4 = s5;
         } else {
          peg$currPos = s4;
          s4 = peg$c0;
         }
        } else {
         peg$currPos = s4;
         s4 = peg$c0;
        }
        while (s4 !== peg$FAILED) {
         s3.push(s4);
         s4 = peg$currPos;
         s5 = [];
         s6 = peg$parsenewline();
         if (s6 !== peg$FAILED) {
          while (s6 !== peg$FAILED) {
           s5.push(s6);
           s6 = peg$parsenewline();
          }
         } else {
          s5 = peg$c0;
         }
         if (s5 !== peg$FAILED) {
          s6 = peg$parseline();
          if (s6 !== peg$FAILED) {
           s5 = [
            s5,
            s6
           ];
           s4 = s5;
          } else {
           peg$currPos = s4;
           s4 = peg$c0;
          }
         } else {
          peg$currPos = s4;
          s4 = peg$c0;
         }
        }
        if (s3 !== peg$FAILED) {
         s4 = [];
         s5 = peg$parsenewline();
         while (s5 !== peg$FAILED) {
          s4.push(s5);
          s5 = peg$parsenewline();
         }
         if (s4 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c3(s2, s3);
          s0 = s1;
         } else {
          peg$currPos = s0;
          s0 = peg$c0;
         }
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parse__() {
      var s0, s1;
      peg$silentFails++;
      if (peg$c5.test(input.charAt(peg$currPos))) {
       s0 = input.charAt(peg$currPos);
       peg$currPos++;
      } else {
       s0 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c6);
       }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c4);
       }
      }
      return s0;
     }
     function peg$parseline() {
      var s0, s1, s2, s3, s4;
      s0 = peg$currPos;
      s1 = peg$parseindent();
      if (s1 !== peg$FAILED) {
       s2 = peg$parseelement();
       if (s2 === peg$FAILED) {
        s2 = peg$parsetextNode();
        if (s2 === peg$FAILED) {
         s2 = peg$parsedirective();
        }
       }
       if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parse__();
        while (s4 !== peg$FAILED) {
         s3.push(s4);
         s4 = peg$parse__();
        }
        if (s3 !== peg$FAILED) {
         peg$reportedPos = s0;
         s1 = peg$c7(s1, s2);
         s0 = s1;
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseindent() {
      var s0, s1, s2;
      peg$silentFails++;
      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parse__();
      while (s2 !== peg$FAILED) {
       s1.push(s2);
       s2 = peg$parse__();
      }
      if (s1 !== peg$FAILED) {
       peg$reportedPos = s0;
       s1 = peg$c9(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c8);
       }
      }
      return s0;
     }
     function peg$parsenewline() {
      var s0, s1;
      peg$silentFails++;
      if (input.charCodeAt(peg$currPos) === 10) {
       s0 = peg$c11;
       peg$currPos++;
      } else {
       s0 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c12);
       }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c10);
       }
      }
      return s0;
     }
     function peg$parsecharacter() {
      var s0, s1;
      peg$silentFails++;
      if (peg$c14.test(input.charAt(peg$currPos))) {
       s0 = input.charAt(peg$currPos);
       peg$currPos++;
      } else {
       s0 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c15);
       }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c13);
       }
      }
      return s0;
     }
     function peg$parseidentifier() {
      var s0, s1, s2, s3;
      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c17.test(input.charAt(peg$currPos))) {
       s1 = input.charAt(peg$currPos);
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c18);
       }
      }
      if (s1 !== peg$FAILED) {
       s2 = [];
       if (peg$c19.test(input.charAt(peg$currPos))) {
        s3 = input.charAt(peg$currPos);
        peg$currPos++;
       } else {
        s3 = peg$FAILED;
        if (peg$silentFails === 0) {
         peg$fail(peg$c20);
        }
       }
       while (s3 !== peg$FAILED) {
        s2.push(s3);
        if (peg$c19.test(input.charAt(peg$currPos))) {
         s3 = input.charAt(peg$currPos);
         peg$currPos++;
        } else {
         s3 = peg$FAILED;
         if (peg$silentFails === 0) {
          peg$fail(peg$c20);
         }
        }
       }
       if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c21(s1, s2);
        s0 = s1;
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c16);
       }
      }
      return s0;
     }
     function peg$parsedottedpath() {
      var s0, s1, s2, s3, s4, s5;
      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseidentifier();
      if (s1 !== peg$FAILED) {
       s2 = [];
       s3 = peg$currPos;
       if (input.charCodeAt(peg$currPos) === 46) {
        s4 = peg$c23;
        peg$currPos++;
       } else {
        s4 = peg$FAILED;
        if (peg$silentFails === 0) {
         peg$fail(peg$c24);
        }
       }
       if (s4 !== peg$FAILED) {
        s5 = peg$parseidentifier();
        if (s5 !== peg$FAILED) {
         s4 = [
          s4,
          s5
         ];
         s3 = s4;
        } else {
         peg$currPos = s3;
         s3 = peg$c0;
        }
       } else {
        peg$currPos = s3;
        s3 = peg$c0;
       }
       while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
         s4 = peg$c23;
         peg$currPos++;
        } else {
         s4 = peg$FAILED;
         if (peg$silentFails === 0) {
          peg$fail(peg$c24);
         }
        }
        if (s4 !== peg$FAILED) {
         s5 = peg$parseidentifier();
         if (s5 !== peg$FAILED) {
          s4 = [
           s4,
           s5
          ];
          s3 = s4;
         } else {
          peg$currPos = s3;
          s3 = peg$c0;
         }
        } else {
         peg$currPos = s3;
         s3 = peg$c0;
        }
       }
       if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c25(s1, s2);
        s0 = s1;
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c22);
       }
      }
      return s0;
     }
     function peg$parsepartial() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 33) {
       s1 = peg$c26;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c27);
       }
      }
      if (s1 !== peg$FAILED) {
       s2 = peg$parseidentifier();
       if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c28(s2);
        s0 = s1;
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseelemId() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 35) {
       s1 = peg$c29;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c30);
       }
      }
      if (s1 !== peg$FAILED) {
       s2 = peg$parseidentifier();
       if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c31(s2);
        s0 = s1;
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseelemClass() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
       s1 = peg$c23;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c24);
       }
      }
      if (s1 !== peg$FAILED) {
       s2 = peg$parseidentifier();
       if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c32(s2);
        s0 = s1;
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parsesquareBracketsValue() {
      var s0, s1, s2;
      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseescapedCharacter();
      if (s2 === peg$FAILED) {
       if (peg$c33.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
       } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
         peg$fail(peg$c34);
        }
       }
      }
      while (s2 !== peg$FAILED) {
       s1.push(s2);
       s2 = peg$parseescapedCharacter();
       if (s2 === peg$FAILED) {
        if (peg$c33.test(input.charAt(peg$currPos))) {
         s2 = input.charAt(peg$currPos);
         peg$currPos++;
        } else {
         s2 = peg$FAILED;
         if (peg$silentFails === 0) {
          peg$fail(peg$c34);
         }
        }
       }
      }
      if (s1 !== peg$FAILED) {
       peg$reportedPos = s0;
       s1 = peg$c35(s1);
      }
      s0 = s1;
      return s0;
     }
     function peg$parseelemAttribute() {
      var s0, s1, s2, s3, s4, s5;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
       s1 = peg$c36;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c37);
       }
      }
      if (s1 !== peg$FAILED) {
       s2 = peg$parseidentifier();
       if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 61) {
         s3 = peg$c38;
         peg$currPos++;
        } else {
         s3 = peg$FAILED;
         if (peg$silentFails === 0) {
          peg$fail(peg$c39);
         }
        }
        if (s3 !== peg$FAILED) {
         s4 = peg$parsesquareBracketsValue();
         if (s4 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 93) {
           s5 = peg$c40;
           peg$currPos++;
          } else {
           s5 = peg$FAILED;
           if (peg$silentFails === 0) {
            peg$fail(peg$c41);
           }
          }
          if (s5 !== peg$FAILED) {
           peg$reportedPos = s0;
           s1 = peg$c42(s2, s4);
           s0 = s1;
          } else {
           peg$currPos = s0;
           s0 = peg$c0;
          }
         } else {
          peg$currPos = s0;
          s0 = peg$c0;
         }
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseelemProperty() {
      var s0, s1, s2, s3, s4, s5, s6;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
       s1 = peg$c36;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c37);
       }
      }
      if (s1 !== peg$FAILED) {
       if (input.charCodeAt(peg$currPos) === 46) {
        s2 = peg$c23;
        peg$currPos++;
       } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
         peg$fail(peg$c24);
        }
       }
       if (s2 !== peg$FAILED) {
        s3 = peg$parsedottedpath();
        if (s3 !== peg$FAILED) {
         if (input.charCodeAt(peg$currPos) === 61) {
          s4 = peg$c38;
          peg$currPos++;
         } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
           peg$fail(peg$c39);
          }
         }
         if (s4 !== peg$FAILED) {
          s5 = peg$parsesquareBracketsValue();
          if (s5 !== peg$FAILED) {
           if (input.charCodeAt(peg$currPos) === 93) {
            s6 = peg$c40;
            peg$currPos++;
           } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
             peg$fail(peg$c41);
            }
           }
           if (s6 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c43(s3, s5);
            s0 = s1;
           } else {
            peg$currPos = s0;
            s0 = peg$c0;
           }
          } else {
           peg$currPos = s0;
           s0 = peg$c0;
          }
         } else {
          peg$currPos = s0;
          s0 = peg$c0;
         }
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseelemEventHandler() {
      var s0, s1, s2, s3, s4, s5, s6;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
       s1 = peg$c36;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c37);
       }
      }
      if (s1 !== peg$FAILED) {
       if (input.charCodeAt(peg$currPos) === 33) {
        s2 = peg$c26;
        peg$currPos++;
       } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
         peg$fail(peg$c27);
        }
       }
       if (s2 !== peg$FAILED) {
        s3 = peg$parseidentifier();
        if (s3 !== peg$FAILED) {
         if (input.charCodeAt(peg$currPos) === 61) {
          s4 = peg$c38;
          peg$currPos++;
         } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
           peg$fail(peg$c39);
          }
         }
         if (s4 !== peg$FAILED) {
          s5 = peg$parsesquareBracketsValue();
          if (s5 !== peg$FAILED) {
           if (input.charCodeAt(peg$currPos) === 93) {
            s6 = peg$c40;
            peg$currPos++;
           } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
             peg$fail(peg$c41);
            }
           }
           if (s6 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c44(s3, s5);
            s0 = s1;
           } else {
            peg$currPos = s0;
            s0 = peg$c0;
           }
          } else {
           peg$currPos = s0;
           s0 = peg$c0;
          }
         } else {
          peg$currPos = s0;
          s0 = peg$c0;
         }
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseelemQualifier() {
      var s0, s1;
      peg$silentFails++;
      s0 = peg$parseelemId();
      if (s0 === peg$FAILED) {
       s0 = peg$parseelemClass();
       if (s0 === peg$FAILED) {
        s0 = peg$parseelemAttribute();
        if (s0 === peg$FAILED) {
         s0 = peg$parseelemProperty();
         if (s0 === peg$FAILED) {
          s0 = peg$parseelemEventHandler();
         }
        }
       }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c45);
       }
      }
      return s0;
     }
     function peg$parseelement() {
      var s0, s1;
      peg$silentFails++;
      s0 = peg$parseimplicitElement();
      if (s0 === peg$FAILED) {
       s0 = peg$parseexplicitElement();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c46);
       }
      }
      return s0;
     }
     function peg$parseimplicitElement() {
      var s0, s1, s2;
      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseelemQualifier();
      if (s2 !== peg$FAILED) {
       while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseelemQualifier();
       }
      } else {
       s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
       s2 = peg$parseelementAdditions();
       if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c47(s1, s2);
        s0 = s1;
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseexplicitElement() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      s1 = peg$parseidentifier();
      if (s1 !== peg$FAILED) {
       s2 = [];
       s3 = peg$parseelemQualifier();
       while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseelemQualifier();
       }
       if (s2 !== peg$FAILED) {
        s3 = peg$parseelementAdditions();
        if (s3 !== peg$FAILED) {
         peg$reportedPos = s0;
         s1 = peg$c48(s1, s2, s3);
         s0 = s1;
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseelementAdditions() {
      var s0, s1, s2, s3, s4;
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = [];
      s3 = peg$parse__();
      if (s3 !== peg$FAILED) {
       while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parse__();
       }
      } else {
       s2 = peg$c0;
      }
      if (s2 !== peg$FAILED) {
       s3 = peg$parsetextNode();
       if (s3 !== peg$FAILED) {
        peg$reportedPos = s1;
        s2 = peg$c49(s3);
        s1 = s2;
       } else {
        peg$currPos = s1;
        s1 = peg$c0;
       }
      } else {
       peg$currPos = s1;
       s1 = peg$c0;
      }
      if (s1 === peg$FAILED) {
       s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
       s2 = peg$currPos;
       s3 = [];
       s4 = peg$parse__();
       if (s4 !== peg$FAILED) {
        while (s4 !== peg$FAILED) {
         s3.push(s4);
         s4 = peg$parse__();
        }
       } else {
        s3 = peg$c0;
       }
       if (s3 !== peg$FAILED) {
        s4 = peg$parsepartial();
        if (s4 !== peg$FAILED) {
         peg$reportedPos = s2;
         s3 = peg$c50(s4);
         s2 = s3;
        } else {
         peg$currPos = s2;
         s2 = peg$c0;
        }
       } else {
        peg$currPos = s2;
        s2 = peg$c0;
       }
       if (s2 === peg$FAILED) {
        s2 = peg$c2;
       }
       if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c51(s1, s2);
        s0 = s1;
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parsetextNode() {
      var s0, s1;
      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsequotedText();
      if (s1 !== peg$FAILED) {
       peg$reportedPos = s0;
       s1 = peg$c53(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c52);
       }
      }
      return s0;
     }
     function peg$parseescapedUnicode() {
      var s0, s1, s2, s3, s4, s5;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 117) {
       s1 = peg$c54;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c55);
       }
      }
      if (s1 !== peg$FAILED) {
       if (peg$c56.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
       } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
         peg$fail(peg$c57);
        }
       }
       if (s2 !== peg$FAILED) {
        if (peg$c56.test(input.charAt(peg$currPos))) {
         s3 = input.charAt(peg$currPos);
         peg$currPos++;
        } else {
         s3 = peg$FAILED;
         if (peg$silentFails === 0) {
          peg$fail(peg$c57);
         }
        }
        if (s3 !== peg$FAILED) {
         if (peg$c56.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
         } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
           peg$fail(peg$c57);
          }
         }
         if (s4 !== peg$FAILED) {
          if (peg$c56.test(input.charAt(peg$currPos))) {
           s5 = input.charAt(peg$currPos);
           peg$currPos++;
          } else {
           s5 = peg$FAILED;
           if (peg$silentFails === 0) {
            peg$fail(peg$c57);
           }
          }
          if (s5 !== peg$FAILED) {
           peg$reportedPos = s0;
           s1 = peg$c58(s2, s3, s4, s5);
           s0 = s1;
          } else {
           peg$currPos = s0;
           s0 = peg$c0;
          }
         } else {
          peg$currPos = s0;
          s0 = peg$c0;
         }
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseescapedASCII() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 120) {
       s1 = peg$c59;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c60);
       }
      }
      if (s1 !== peg$FAILED) {
       if (peg$c56.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
       } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
         peg$fail(peg$c57);
        }
       }
       if (s2 !== peg$FAILED) {
        if (peg$c56.test(input.charAt(peg$currPos))) {
         s3 = input.charAt(peg$currPos);
         peg$currPos++;
        } else {
         s3 = peg$FAILED;
         if (peg$silentFails === 0) {
          peg$fail(peg$c57);
         }
        }
        if (s3 !== peg$FAILED) {
         peg$reportedPos = s0;
         s1 = peg$c61(s2, s3);
         s0 = s1;
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseescapedCharacter() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
       s1 = peg$c62;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c63);
       }
      }
      if (s1 !== peg$FAILED) {
       s2 = peg$parseescapedUnicode();
       if (s2 === peg$FAILED) {
        s2 = peg$parseescapedASCII();
        if (s2 === peg$FAILED) {
         s2 = peg$parsecharacter();
        }
       }
       if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c64(s2);
        s0 = s1;
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parsedoubleQuotedText() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
       s1 = peg$c65;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c66);
       }
      }
      if (s1 !== peg$FAILED) {
       s2 = [];
       s3 = peg$parseescapedCharacter();
       if (s3 === peg$FAILED) {
        if (peg$c67.test(input.charAt(peg$currPos))) {
         s3 = input.charAt(peg$currPos);
         peg$currPos++;
        } else {
         s3 = peg$FAILED;
         if (peg$silentFails === 0) {
          peg$fail(peg$c68);
         }
        }
       }
       while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseescapedCharacter();
        if (s3 === peg$FAILED) {
         if (peg$c67.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
         } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
           peg$fail(peg$c68);
          }
         }
        }
       }
       if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 34) {
         s3 = peg$c65;
         peg$currPos++;
        } else {
         s3 = peg$FAILED;
         if (peg$silentFails === 0) {
          peg$fail(peg$c66);
         }
        }
        if (s3 !== peg$FAILED) {
         peg$reportedPos = s0;
         s1 = peg$c35(s2);
         s0 = s1;
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parsesingleQuotedText() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
       s1 = peg$c69;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c70);
       }
      }
      if (s1 !== peg$FAILED) {
       s2 = [];
       s3 = peg$parseescapedCharacter();
       if (s3 === peg$FAILED) {
        if (peg$c71.test(input.charAt(peg$currPos))) {
         s3 = input.charAt(peg$currPos);
         peg$currPos++;
        } else {
         s3 = peg$FAILED;
         if (peg$silentFails === 0) {
          peg$fail(peg$c72);
         }
        }
       }
       while (s3 !== peg$FAILED) {
        s2.push(s3);
        s3 = peg$parseescapedCharacter();
        if (s3 === peg$FAILED) {
         if (peg$c71.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
         } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
           peg$fail(peg$c72);
          }
         }
        }
       }
       if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 39) {
         s3 = peg$c69;
         peg$currPos++;
        } else {
         s3 = peg$FAILED;
         if (peg$silentFails === 0) {
          peg$fail(peg$c70);
         }
        }
        if (s3 !== peg$FAILED) {
         peg$reportedPos = s0;
         s1 = peg$c35(s2);
         s0 = s1;
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parsequotedText() {
      var s0, s1;
      peg$silentFails++;
      s0 = peg$parsedoubleQuotedText();
      if (s0 === peg$FAILED) {
       s0 = peg$parsesingleQuotedText();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c73);
       }
      }
      return s0;
     }
     function peg$parsedirective() {
      var s0, s1;
      peg$silentFails++;
      s0 = peg$parseexprDirective();
      if (s0 === peg$FAILED) {
       s0 = peg$parsesimpleDirective();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c74);
       }
      }
      return s0;
     }
     function peg$parsesimpleDirective() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 64) {
       s1 = peg$c75;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c76);
       }
      }
      if (s1 !== peg$FAILED) {
       s2 = peg$parseidentifier();
       if (s2 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c77(s2);
        s0 = s1;
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     function peg$parseexprDirective() {
      var s0, s1, s2, s3, s4, s5;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 64) {
       s1 = peg$c75;
       peg$currPos++;
      } else {
       s1 = peg$FAILED;
       if (peg$silentFails === 0) {
        peg$fail(peg$c76);
       }
      }
      if (s1 !== peg$FAILED) {
       s2 = peg$parseidentifier();
       if (s2 !== peg$FAILED) {
        s3 = [];
        s4 = peg$parse__();
        if (s4 !== peg$FAILED) {
         while (s4 !== peg$FAILED) {
          s3.push(s4);
          s4 = peg$parse__();
         }
        } else {
         s3 = peg$c0;
        }
        if (s3 !== peg$FAILED) {
         s4 = [];
         s5 = peg$parsecharacter();
         if (s5 !== peg$FAILED) {
          while (s5 !== peg$FAILED) {
           s4.push(s5);
           s5 = peg$parsecharacter();
          }
         } else {
          s4 = peg$c0;
         }
         if (s4 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c78(s2, s4);
          s0 = s1;
         } else {
          peg$currPos = s0;
          s0 = peg$c0;
         }
        } else {
         peg$currPos = s0;
         s0 = peg$c0;
        }
       } else {
        peg$currPos = s0;
        s0 = peg$c0;
       }
      } else {
       peg$currPos = s0;
       s0 = peg$c0;
      }
      return s0;
     }
     var depths = [0];
     peg$result = peg$startRuleFunction();
     if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
     } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
       peg$fail({
        type: 'end',
        description: 'end of input'
       });
      }
      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
     }
    }
    return {
     SyntaxError: SyntaxError,
     parse: parse
    };
   }();
   return pegjsParser;
  }(parserParsehelpers);
 var parserPreprocessor = function () {
   var newlines = /\r\n|\r|\n/, whitespace = /^[ \t]*$/, comment = /\/\*((?:\/(?!<\*)|[^\/])*?)\*\//g, removeComment, removeWhitespace;
   removeComment = function (m, p1) {
    return p1.split(newlines).map(function () {
     return '';
    }).join('\n');
   };
   removeWhitespace = function (l) {
    return l.match(whitespace) ? '' : l;
   };
   return function (text) {
    return text.replace(comment, removeComment).split(newlines).map(removeWhitespace).reduce(function (lines, line) {
     if (lines.length) {
      var prevline = lines[lines.length - 1];
      if (prevline[prevline.length - 1] === '\\') {
       lines[lines.length - 1] = prevline.replace(/\s*\\$/, '') + line.replace(/^\s*/, '');
      } else {
       lines.push(line);
      }
     } else {
      lines.push(line);
     }
     return lines;
    }, []).join('\n');
   };
  }();
 var utilAmdplugin = function (misc) {
   
   function getTemplateCode(template) {
    return 'new ist.Template(' + JSON.stringify(template.name) + ', ' + JSON.stringify(template.nodes) + ')';
   }
   function pluginify(ist) {
    var fetchText, buildMap = {};
    if (isBrowser) {
     fetchText = function (url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onreadystatechange = function () {
       if (xhr.readyState === 4) {
        if (xhr.status !== 200) {
         throw new Error('HTTP status ' + xhr.status + ' when loading ' + url);
        }
        callback(xhr.responseText);
       }
      };
      xhr.send(null);
     };
    } else if (isNode) {
     var fs = require.nodeRequire('fs');
     fetchText = function (url, callback) {
      var file = fs.readFileSync(url, 'utf8');
      if (file.indexOf('\uFEFF') === 0) {
       file = file.substring(1);
      }
      callback(file);
     };
    }
    ist.write = function (pluginName, name, write) {
     var bmName = 'ist!' + name;
     if (buildMap.hasOwnProperty(bmName)) {
      var text = buildMap[bmName];
      write(text);
     }
    };
    ist.load = function (name, parentRequire, load, config) {
     var path, dirname;
     path = parentRequire.toUrl(name + '.ist');
     dirname = name.indexOf('/') === -1 ? '.' : name.replace(/\/[^\/]*$/, '');
     fetchText(path, function (text) {
      var code, deps = ['ist'];
      text = text.replace(/^(\s*)@include\s+(?:text=)?(['"])((?:(?=(\\?))\4.)*?)\2/gm, function (m, p1, p2, p3) {
       if (misc.findScript(p3)) {
        return m;
       }
       var dpath = dirname + '/' + p3.replace(/\.ist$/, '');
       if (deps.indexOf('ist!' + dpath) === -1) {
        deps.push('ist!' + dpath);
       }
       return p1 + '@include "' + dpath + '"';
      });
      code = getTemplateCode(ist(text, name));
      text = 'define(\'ist!' + name + '\',' + JSON.stringify(deps) + ', function(ist) {\n' + '  return ' + code + ';\n' + '});\n';
      if (config.isBuild) {
       buildMap['ist!' + name] = text;
      }
      if (!config.isBuild) {
       text += '\r\n//@ sourceURL=' + path;
      }
      load.fromText('ist!' + name, text);
      parentRequire(['ist!' + name], function (value) {
       load(value);
      });
     });
    };
   }
   return pluginify;
  }(utilMisc);
 var main = function (Template, directives, Context, pegjsParser, preprocess, pluginify, misc) {
   
   function ist(template, name) {
    var parsed;
    name = name || '<unknown>';
    try {
     parsed = pegjsParser.parse(preprocess(template));
    } catch (e) {
     e.message += ' in \'' + name + '\' on line ' + e.line + (typeof e.column !== 'undefined' ? ', character ' + e.column : '');
     throw e;
    }
    return new Template(name, parsed);
   }
   ist.Template = Template;
   ist.fromScriptTag = function (id) {
    if (console)
     (console.warn || console.log)('Warning: ist.fromScriptTag is deprecated, use ist.script instead');
    return ist.script(id);
   };
   ist.registerHelper = function (name, helper) {
    if (console)
     (console.warn || console.log)('Warning: ist.registerHelper is deprecated, use ist.helper instead');
    ist.helper(name, helper);
   };
   ist.createNode = function (branchSpec, context, doc) {
    if (console)
     (console.warn || console.log)('Warning: ist.createNode is deprecated, use ist.create instead');
    return ist.create(branchSpec, context, doc);
   };
   ist.create = function (branchSpec, context, doc) {
    var nodes = branchSpec.split('>').map(function (n) {
      return n.trim();
     }), indent = '', template = '', rendered;
    nodes.forEach(function (nodeSpec) {
     template += '\n' + indent + nodeSpec;
     indent += ' ';
    });
    rendered = ist(template).render(context, doc);
    return rendered.childNodes.length === 1 ? rendered.firstChild : rendered;
   };
   ist.script = function (id) {
    var template = misc.findScript(id);
    if (template) {
     return ist(template);
    }
   };
   ist.helper = function (name, helper) {
    directives.register(name, helper);
   };
   ist.helper('include', function (ctx, value, tmpl, iterate) {
    iterate(function (key, rendered) {
     if (rendered) {
      rendered.update(ctx);
     } else {
      var name = value, what = name.replace(/\.ist$/, ''), found, tryReq;
      found = misc.findScript(name);
      if (isAMD) {
       tryReq = [
        what,
        what + '.ist',
        'ist!' + what,
        'text!' + what + '.ist'
       ];
       while (!found && tryReq.length) {
        try {
         found = requirejs(tryReq.shift());
        } catch (e) {
        }
       }
      }
      if (!found) {
       throw new Error('Cannot find included template \'' + name + '\'');
      }
      if (typeof found === 'string') {
       found = ist(found, what);
      }
      if (typeof found.render === 'function') {
       return found.render(ctx);
      } else {
       throw new Error('Invalid included template \'' + name + '\'');
      }
     }
    });
   });
   ist.global = function (key, value) {
    Context.globalScope[key] = value;
   };
   if (isNode || isBrowser && isAMD) {
    pluginify(ist);
   }
   return ist;
  }(componentsTemplate, componentsDirectives, componentsContext, parserParser, parserPreprocessor, utilAmdplugin, utilMisc);
 if (isAMD || isNode) {
  define('ist', [], function () {
   return main;
  });
 } else {
  var previous = global.ist;
  global.ist = main;
  global.ist.noConflict = function () {
   var ist = global.ist;
   global.ist = previous;
   return ist;
  };
 }
}(this));