/*jshint evil:true */
/*global define */
define([], function() {
	'use strict';


	/**
	 * Context object; holds the rendering context and target document,
	 * and provides helper methods.
	 */
	function Context(object, doc) {
		this.value = object;
		this.values = [object];

		this.doc = doc || document;
		this.rootScope = this.scope = Context.globalScope;
	}


	Context.globalScope = {};


	Context.prototype = {
		/* Node creation aliases */
		importNode: function(node, deep) {
			if (node.ownerDocument === this.doc) {
				return node.cloneNode(deep);
			} else {
				return this.doc.importNode(node, deep);
			}
		},
		
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
			return this.doc.createTextNode(text);
		},

		createComment: function(comment) {
			return this.doc.createComment(comment);
		},
		
		/* Push an object on the scope stack. All its properties will be
		   usable inside expressions and hide any previously available
		   property with the same name */
		pushScope: function(scope) {
			var newScope = Object.create(this.scope);

			Object.keys(scope).forEach(function(key) {
				newScope[key] = scope[key];
			});

			this.scope = newScope;
		},
		
		/* Pop the last object pushed on the scope stack  */
		popScope: function() {
			var thisScope = this.scope;

			if (thisScope === this.rootScope) {
				throw new Error('No scope left to pop out');
			}

			this.scope = Object.getPrototypeOf(thisScope);
		},

		pushValue: function(value) {
			this.values.unshift(value);
			this.value = value;

			if (value !== undefined && value !== null && typeof value !== 'string' && typeof value !== 'number') {
				this.pushScope(value);
			} else {
				this.pushScope({});
			}
		},

		popValue: function() {
			this.popScope();

			this.values.shift();
			this.value = this.values[0];
		},

		createContext: function(newValue) {
			return new Context(newValue, this.doc);
		},

		scopedCall: function(fn, target) {
			return fn.call(this.value, this.doc, this.scope, target);
		}
	};
	
	return Context;
});
