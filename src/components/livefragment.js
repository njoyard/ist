define(function() {
	/*
	 * LiveFragment object; used to represent a "live"-DocumentFragment.
	 * It is created from an existing an continuous set of sibling nodes.
	 * Operations on a LiveFragment are propagated to its parent.
	 */
	var LiveFragment = function(parent, nodes, prev, next) {
		if (nodes.length === 0) {
			if (!prev || !next) {
				throw new Error("Cannot find adjacent siblings");
			}
			
			this.previousSibling = prev;
			this.nextSibling = next;
		} else {
			this.previousSibling = nodes[0].previousSibling;
			this.nextSibling = nodes[nodes.length - 1].nextSibling;
		}
		
		if (parent instanceof LiveFragment) {
			this.parentNode = parent.parentNode;
		} else {
			this.parentNode = parent;
		}
	
		this.nodeType = this.parentNode.DOCUMENT_FRAGMENT_NODE;
		this.childNodes = nodes;
	};

	LiveFragment.prototype = {
		appendChild: function(node) {
			var cn, i, len;
			if (node.nodeType === node.DOCUMENT_FRAGMENT_NODE) {
				cn = node.childNodes;
				for (i = 0, len = cn.length; i < len; i++) {
					this.appendChild(cn[i]);
				}
			
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
		
		insertBefore: function(newNode, refNode) {
			var index, cn, i, len;
			
			if (!refNode) {
				return this.appendChild(newNode);
			}
			
			if (newNode.nodeType === newNode.DOCUMENT_FRAGMENT_NODE) {
				cn = newNode.childNodes;
				for (i = 0, len = cn.length; i < len; i++) {
					this.appendChild(cn[i]);
				}
			
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
		
		removeChild: function(node) {
			var index = this.childNodes.indexOf(node);
			
			if (index === -1) {
				throw new Error("Cannot remove node");
			}
			
			this.parentNode.removeChild(node);
			this.childNodes.splice(index, 1);
			
			return node;
		},
		
		replaceChild: function(newNode, oldNode) {
			var index = this.childNodes.indexOf(newNode);
			
			if (index === -1) {
				throw new Error("Cannot replace node");
			}
			
			this.parentNode.replaceChild(newNode, oldNode);
			this.childNodes.splice(index, 1, newNode);
			
			return oldNode;
		},
		
		empty: function() {
			this.childNodes.forEach(function(node) {
				this.parentNode.removeChild(node);
			}, this);
			
			this.childNodes = [];
		},
		
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
		}
	};
	
	return LiveFragment;
});
