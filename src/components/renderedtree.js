/*global define */
define(['components/rendereddirective', 'util/misc'], function(RenderedDirective, misc) {
	'use strict';

	function RenderedTree(element, childrenIndex) {
		this.element = element;
		this.childrenIndex = childrenIndex || [];
		this.appendDone = false;
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


	// FIXME only used on root tree when updating, maybe move this to Renderer ?
	RenderedTree.prototype.updateParent = function() {
		var item = this.childrenIndex[0];

		// TODO better handle the case where no nodes have been rendered
		if (item) {
			this.element = null;
			if (item instanceof RenderedTree) {
				this.element = item.element.parentNode;
			} else if (item instanceof RenderedDirective) {
				this.element = item.firstChild.parentNode;
			} else {
				this.element = item.parentNode;
			}
		}
	};


	RenderedTree.prototype.appendChildren = function() {
		var parent = this.element,
			index = this.childrenIndex;

		if (parent) {
			if (!this.appendDone) {
				index.forEach(function(indexItem) {
					if (indexItem instanceof RenderedTree) {
						parent.appendChild(indexItem.element);
					} else if (indexItem instanceof RenderedDirective) {
						misc.appendNodeSegment(indexItem.firstChild, indexItem.lastChild, parent);
					} else {
						parent.appendChild(indexItem);
					}
				});

				this.appendDone = true;
			} else {
				var nextSibling = null;

				for (var i = index.length - 1; i >= 0; i--) {
					var indexItem = index[i];

					if (indexItem instanceof RenderedTree) {
						nextSibling = indexItem.element;
					} else if (indexItem instanceof RenderedDirective) {
						misc.insertNodeSegmentBefore(
							indexItem.firstChild,
							indexItem.lastChild,
							parent,
							nextSibling
						);

						nextSibling = indexItem.firstChild || nextSibling;
					} else {
						nextSibling = indexItem;
					}
				}
			}
		}
	};

	return RenderedTree;
});