/*global define */
define([
	'components/context',
	'components/directives',
	'components/renderedtree',
	'components/rendereddirective'
],
function(Context, directives, RenderedTree, RenderedDirective) {
	'use strict';


	function Renderer(template) {
		this.template = template;
		this.context = undefined;
	}


	Renderer.prototype.setContext = function(context, doc) {
		doc = doc || (this.context ? this.context.doc : document);

		if (context instanceof Context) {
			this.context = context;
		} else {
			this.context = new Context(context, doc);
		}
	};


	/* Error completion helper */
	Renderer.prototype._completeError = function(err, node) {
		return this.template._completeError(err, node);
	};


	/* Text node rendering helper */
	Renderer.prototype._renderTextNode = function(node, textNode) {
		var ctx = this.context;

		if (!textNode) {
			if ('pr' in node) {
				textNode = ctx.importNode(node.pr, false);
			} else {
				textNode = ctx.createTextNode('');
			}
		}

		if (!('pr' in node)) {
			try {
				ctx.scopedCall(node.updater, textNode);
			} catch (err) {
				throw this._completeError(err, node);
			}
		}

		return textNode;
	};

	
	/* Element rendering helper */
	Renderer.prototype._renderElement = function(node, elementNode) {
		var ctx = this.context;

		if (!elementNode) {
			elementNode = ctx.importNode(node.pr, false);
		}

		try {
			ctx.scopedCall(node.updater, elementNode);
		} catch(err) {
			throw this._completeError(err, node);
		}
		
		return elementNode;
	};
	
	
	/* Directive rendering helpers */
	Renderer.prototype._renderDirective = function(node, renderedDirective) {
		var ctx = this.context,
			pr = node.pr,
			helper = directives.get(node.directive);

		if (typeof helper !== 'function') {
			throw new Error('No directive helper for @' + node.directive + ' has been registered');
		}

		if (!renderedDirective) {
			renderedDirective = new RenderedDirective();
		}

		var fragment = renderedDirective.createFragment(ctx);

		if (fragment.firstChild && fragment.firstChild._isISTPlaceHolder) {
			fragment.removeChild(fragment.firstChild);
		}
	
		try {
			helper.call(null, ctx, ctx.scopedCall(pr.evaluator), pr.template, fragment);
		} catch (err) {
			throw this._completeError(err, node);
		}

		if (fragment.childNodes.length === 0) {
			var placeholder = ctx.createComment('');

			placeholder._isISTPlaceHolder = true;
			fragment.appendChild(placeholder);
		}

		renderedDirective.updateFromFragment(fragment);
		return renderedDirective;
	};




	Renderer.prototype._renderRec = function(node, indexEntry) {
		if ('text' in node) {
			indexEntry = this._renderTextNode(node, indexEntry);
		}
				
		if ('tagName' in node) {
			if (indexEntry) {
				indexEntry.element = this._renderElement(node, indexEntry.element);
			} else {
				indexEntry = new RenderedTree(this._renderElement(node));
			}

			this._renderNodes(node.children, indexEntry);
		}
		
		if ('directive' in node) {
			indexEntry = this._renderDirective(node, indexEntry);
		}

		return indexEntry;
	};


	Renderer.prototype._renderNodes = function(nodes, tree) {
		tree.forEach(nodes, this._renderRec, this);
		tree.appendChildren();
	};


	Renderer.prototype.render = function() {
		var renderer = this,
			fragment = this.context.createDocumentFragment(),
			nodes = this.template.nodes,
			tree = new RenderedTree(fragment);

		this._renderNodes(nodes, tree);

		fragment.update = function(ctx) {
			if (ctx) {
				renderer.setContext(ctx);
			}

			tree.updateParent();
			renderer._renderNodes(nodes, tree);
		};

		return fragment;
	};


	return Renderer;
});