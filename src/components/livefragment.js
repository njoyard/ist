define(function() {
	var slice = Array.prototype.slice;
	
	/*
	 * LiveFragment object; used to represent a "live"-DocumentFragment.
	 *
	 * Has the same API as a DocumentFragment, with some additions.  Operations
	 * on a LiveFragment are propagated to its parent.
	 *
	 * new LiveFragment(node)
	 * 	creates a LiveFragment holding all child nodes of 'node'.  Can be used
	 * 	with a "real" node, a DocumentFragment or an other LiveFragment.
	 *
	 * new LiveFragment(node, [], prevNode, nextNode)
	 * 	creates an empty LiveFragment inside 'node' between 'prevNode' and
	 * 	'nextNode'
	 *
	 * new LiveFragment(node, [nodes...])
	 * 	creates a LiveFragment holding a subset of child nodes from 'node'.  The
	 *  subset must be contiguous (and it may be an Array or a NodeList).
	 */
	var LiveFragment = function(parent, nodes, prev, next) {
		if (typeof nodes === 'undefined') {
			this.childNodes = slice.call(parent.childNodes);
			this.previousSibling = null;
			this.nextSibling = null;
		} else {
			if (nodes.length === 0) {
				if (!prev || !next) {
					throw new Error("Cannot find adjacent siblings");
				}
			
				// TODO check validity of prev/next
				this.previousSibling = prev;
				this.nextSibling = next;
			} else {
				// TODO check whether nodes are contiguous
				this.previousSibling = nodes[0].previousSibling;
				this.nextSibling = nodes[nodes.length - 1].nextSibling;
			}
			
			this.childNodes = slice.call(nodes);
		}
		
		if (parent instanceof LiveFragment) {
			this.parentNode = parent.parentNode;
		} else {
			// TODO check validity of parent
			this.parentNode = parent;
		}
	
		// Make other LiveFragments treat this as a DocumentFragment
		this.nodeType = this.parentNode.DOCUMENT_FRAGMENT_NODE;
	};

	LiveFragment.prototype = {
		/* Append node to fragment, removing it from its parent first.
		   Can be called with a DocumentFragment or a LiveFragment */
		appendChild: function(node) {
			if (node.nodeType === node.DOCUMENT_FRAGMENT_NODE) {
				slice.call(node.childNodes).forEach(this.appendChild, this);
				return;
			}
		
			// Remove child from its parent first
			if (node.parentNode) {
				node.parentNode.removeChild(node);
			}
			
			try {
				this.removeChild(node);
			} catch (e) {
			}
		
			if (this.nextSibling) {
				this.parentNode.insertBefore(node, this.nextSibling);
			} else {
				this.parentNode.appendChild(node);
			}
			
			this.childNodes.push(node);
			
			return node;
		},
		
		/* Insert node into fragment before reference node, removing it from its
			parent first. Can be called with a DocumentFragment or a
			LiveFragment */
		insertBefore: function(newNode, refNode) {
			var index;
			
			if (!refNode) {
				return this.appendChild(newNode);
			}
			
			if (newNode.nodeType === newNode.DOCUMENT_FRAGMENT_NODE) {
				slice.call(newNode.childNodes).forEach(function(n) {
					this.insertBefore(n, refNode);
				}, this);
				return;
			}
			
			// Remove child from its parent first
			if (newNode.parentNode) {
				newNode.parentNode.removeChild(newNode);
			}
			
			try {
				this.removeChild(newNode);
			} catch (e) {
			}
			
			index = this.childNodes.indexOf(refNode);
			
			if (index === -1) {
				throw new Error("Cannot find reference node");
			}
			
			this.parentNode.insertBefore(newNode, refNode);
			this.childNodes.splice(index, 0, newNode);
			
			return newNode;
		},
		
		/* Remove node from fragment */
		removeChild: function(node) {
			var index = this.childNodes.indexOf(node);
			
			if (index === -1) {
				throw new Error("Cannot remove node");
			}
			
			this.parentNode.removeChild(node);
			this.childNodes.splice(index, 1);
			
			return node;
		},
		
		/* Replace node in fragment */
		replaceChild: function(newNode, oldNode) {
			var index = this.childNodes.indexOf(newNode);
			
			if (index === -1) {
				throw new Error("Cannot replace node");
			}
			
			this.parentNode.replaceChild(newNode, oldNode);
			this.childNodes.splice(index, 1, newNode);
			
			return oldNode;
		},
		
		/* Remove all nodes from fragment */
		empty: function() {
			this.childNodes.forEach(function(node) {
				this.parentNode.removeChild(node);
			}, this);
			
			this.childNodes = [];
		},
		
		/* Extend fragment to adjacent node */
		extend: function(node) {
			if (node === this.nextSibling) {
				this.childNodes.push(this.nextSibling);
				this.nextSibling = this.nextSibling.nextSibling;
				return;
			}
			
			if (node === this.previousSibling) {
				this.childNodes.unshift(this.previousSibling);
				this.previousSibling = this.previousSibling.previousSibling;
				return;
			}
			
			throw new Error("Cannot extend to non-adjacent node");
		},
		
		get firstChild() {
			return this.childNodes[0] || null;
		},
		
		get lastChild() {
			return this.childNodes[this.childNodes.length - 1] || null;
		},
		
		get hasChildNodes() {
			return this.childNodes.length > 0;
		}
	};
	
	return LiveFragment;
});
