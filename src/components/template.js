/*global define, console */
define([
	'components/codegen',
	'components/context',
	'components/directives',
	'util/misc'
],
function(codegen, Context, directives, misc) {
	'use strict';

	var expressionRE = /{{((?:}(?!})|[^}])*)}}/;

	function findPartialRec(name, nodes) {
		var found, i, len,
			results = nodes.filter(function(n) {
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


	/**
	 * Template object; encapsulate template nodes and rendering helpers
	 */
	function Template(name, nodes) {
		this.name = name || '<unknown>';
		this.nodes = nodes;

		if (typeof document !== 'undefined') {
			this.pre = document.createDocumentFragment();
			this.update = codegen.compile(this._preRenderTree(nodes, this.pre));
		}
	}


	Template.prototype._preRenderTree = function(templateNodes, parent) {
		var code = [];
		var self = this;

		templateNodes.forEach(function(templateNode) {
			var node;

			code.push(codegen.next());

			try {
				if ('tagName' in templateNode) {
					node = document.createElement(templateNode.tagName);

					(templateNode.classes || []).forEach(function(cls) {
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
					node = document.createComment('@' + templateNode.directive + ' ' +  templateNode.expr + ' (' + self.name + ':' + templateNode.line + ')');

					if (templateNode.children && templateNode.children.length) {
						node.template = new Template(self.name, templateNode.children);
					}

					code.push(codegen.directive(templateNode));
				}

				parent.appendChild(node);
			} catch(e) {
				throw self._completeError(e, templateNode.line);
			}
		});

		return codegen.wrap(code);
	};



	/* Look for a node with the given partial name and return a new
	   Template object if found */
	Template.prototype.findPartial = function(name) {
		if (console) (console.warn || console.log)('Warning: Template#findPartial is deprecated, use Template#partial instead');
		return this.partial(name);
	};
	Template.prototype.partial = function(name) {
		var result;

		if (typeof name === 'undefined') {
			return;
		}

		result = findPartialRec(name, this.nodes);

		if (result) {
			return new Template(this.name, [result]);
		}
	};

	Template.prototype._completeError = function(err, line) {
		var current = 'in \'' + this.name + '\' on line ' + (line || '<unknown>');

		if (typeof err.istStack === 'undefined') {
			err.message += ' ' + current;
			err.istStack = [];
		}

		err.istStack.push(current);
		return err;
	};

	/* Render template using 'context' in 'doc' */
	Template.prototype.render = function(context, doc) {
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

		fragment.update = function(ctx) {
			ctx = getContext(ctx || context);

			lastNode = self.update(function(err, line) {
				return self._completeError(err, line);
			}, directives, ctx, misc.buildNodelist(firstNode, lastNode));
		};

		fragment._first = function() {
			return firstNode;
		};

		fragment._last = function() {
			return lastNode;
		};

		fragment.update(context);

		return fragment;
	};

	return Template;
});
