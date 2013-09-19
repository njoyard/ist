/*global define */
define(['components/rendereddirective'], function(RenderedDirective) {
	'use strict';


	function appendNodeSegment(firstChild, lastChild, target) {
		var node = firstChild;

		while (node && node != lastChild.nextSibling) {
			target.appendChild(node);
			node = node.nextSibling;
		}
	}


	function RenderedTree(element, childrenIndex) {
		this.element = element;
		this.childrenIndex = childrenIndex || [];
	}


	/**
	 * Loop over `templateNodes`, calling `fn` with context `that` with
	 * each template node and the element from this.childrenIndex at the
	 * same position
	 */
	RenderedTree.prototype.forEach = function(templateNodes, fn, that) {
		var index = this.childrenIndex;

		templateNodes.forEach(function(node, i) {
			index[i] = fn.call(this, node, index[i]);
		}, that);
	};


	RenderedTree.prototype.appendChildren = function() {
		var parent = this.element;

		// TODO do not reappend children if unnecessary
		this.childrenIndex.forEach(function(indexItem) {
			if (indexItem instanceof RenderedTree) {
				parent.appendChild(indexItem.element);
			} else if (indexItem instanceof RenderedDirective) {
				appendNodeSegment(indexItem.firstChild, indexItem.lastChild, parent);
			} else {
				parent.appendChild(indexItem);
			}
		});
	};

	return RenderedTree;
});