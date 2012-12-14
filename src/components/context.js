define(function() {
	/**
	 * Context object; holds the rendering context and target document,
	 * and provides helper methods.
	 */
	var Context = function(object, doc) {
		this.value = object;
		this.doc = doc || document;
		this.scopes = [ { document: this.doc } ];
		
		if (typeof object !== 'undefined') {
			this.scopes.push(object);
		}
	};


	Context.prototype = {
		/* Node creation aliases */
		importNode: function(node, deep) {
			return this.doc.importNode(node, deep);
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
		
		istData: function(node) {
			node._ist_data = node._ist_data || {};
			return node._ist_data;
		},
		
		/* Push an object on the scope stack. All its properties will be
		   usable inside expressions and hide any previously available
		   property with the same name */
		pushScope: function(scope) {
			this.scopes.unshift(scope);
		},
		
		/* Pop the last object pushed on the scope stack  */
		popScope: function() {
			if (this.scopes.length < 3) {
				throw new Error("No scope left to pop out");
			}
			
			return this.scopes.shift();
		},
		
		/* Deprecated, use pushScope */
		pushEvalVar: function(name, value) {
			var scope = {};
			scope[name] = value;
			this.pushScope(scope);
		},
		
		/* Deprecated, use popScope */
		popEvalVar: function(name) {
			var scope = scopes[0];
			
			if (typeof scope[name] === 'undefined' || Object.keys(scope).length > 1) {
				throw new Error("Cannot pop variable, does not match topmost scope");
			}
			
			return this.popScope()[name];
		},
	
		/**
		 * Evaluate `expr` in a scope where the current context is available
		 * as `this`, all its own properties that are not reserved words are
		 * available as locals, and the target document is available as `document`.
		 */
		evaluate: function(expr) {
			var fexpr = "return " + expr + ";",
				scopeNames = [],
				func;

			this.scopes.forEach(function(scope, index) {
				scopeNames.push("scope" + index);
				fexpr = "with(scope" + index + "){\n" + fexpr + "\n}";
			});
			
			func = new Function(scopeNames.join(','), fexpr);
			
			return func.apply(this.value, this.scopes);
		},
	
		interpolate: function(text) {		
			return text.replace(/{{((?:}(?!})|[^}])*)}}/g, (function(m, p1) { return this.evaluate(p1); }).bind(this));
		},
	
		createContext: function(newValue) {
			return new Context(newValue, this.doc);
		}
	};
	
	return Context;
});
