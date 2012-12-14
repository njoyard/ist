/**
 * IST: Indented Selector Templating
 *
 * Copyright (c) 2012 Nicolas Joyard
 * Released under the MIT license.
 *
 * Author: Nicolas Joyard <joyard.nicolas@gmail.com>
 * http://njoyard.github.com/ist
 */
define(function() {
	/*
	 * LiveFragment object; used to represent a "live"-DocumentFragment.
	 * It is created from an existing an continuous set of sibling nodes.
	 * Operations on a LiveFragment are propagated to its parent.
	 */
	var LiveFragment = function(parent, nodes, prev, next) {
		this.parentNode = parent;
		this.childNodes = nodes;
		this.previousSibling = prev;
		this.nextSibling = next;
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
		}
	};
	
	return LiveFragment;
});
