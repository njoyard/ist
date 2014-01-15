/*jshint evil:true */
/*global define*/
define([], function() {
	'use strict';

	var expressionRE = /{{\s*((?:}(?!})|[^}])*?)\s*}}/,
		codeCache = {},
		noop = function() {},
		undefObserver = function(__scope__, __set__) { __set__(); return noop; },
		slice = [].slice;



	/*!
	 * Helpers
	 */


	/* Common text node updater */
	function textUpdater(__closure__, __scope__, textNode) {
		/*jshint validthis:true*/
		__closure__.call(this, __scope__, function(v) { textNode.textContent = '' + v; });
	}


	/* Common directive expression evaluator */
	function directiveEvaluator(__closure__, __scope__, __set__) {
		/*jshint validthis:true*/
		return __closure__.call(this, __scope__, __set__);
	}


	/* Set property path in target to value */
	function setPath(target, path, value) {
		var elements = typeof path === 'string' ? path.split('.') : slice.call(path);

		while (elements.length) {
			var element = elements.shift();

			if (elements.length === 0) {
				target[element] = value;
				return;
			} else if (!(element in target)) {
				target[element] = {};
			}

			target = target[element];
		}
	}



	/*
	 *! Closure
	 */


	/*
	 * Closure ctor
	 *
	 * A Closure wraps a function with a "closure object".  Calling
	 * the 'call' and 'apply' methods will work as on a JS function,
	 * but will also inject the "closure object" in the beginning of
	 * the argument list. For instance when using:
	 *
	 *    var closure = new Closure(func, { foo: 'bar' });
	 *
	 * Calling closure.call(thisValue, arg1, ..., argN) will actually
	 * do:
	 *
	 *    func.apply(thisValue, [
	 *        { foo: 'bar' },
	 *        arg1, ..., argN
	 *    ]);
	 *
	 */
	function Closure(func, closure) {
		this.func = func;
		this.closure = closure;
	}

	Closure.prototype.call = function() {
		var args = slice.call(arguments);
		var thisValue = args.shift();

		args.unshift(this.closure);
		return this.func.apply(thisValue, args);
	};

	Closure.prototype.apply = function(thisValue, args) {
		args = slice.call(args);

		args.unshift(this.closure);
		return this.func.apply(thisValue, args);
	};



	/*
	 *! Private code generators
	 */


	var expressionCode =
		'var __value__;' +
		'if (this !== null && this !== undefined) {' +
			'with (this) { with (__scope__) { __set__((EXPR)); } }' +
		'} else {' +
			'with (__scope__) { __set__((EXPR)); }' +
		'}' +
		'return __closure__;';

	function getEvaluator(expr) {
		expr = expr.trim();
		var cacheKey = '{{' + expr + '}}';

		if (!(cacheKey in codeCache)) {
			codeCache[cacheKey] = new Closure(
				new Function('__closure__,__scope__,__set__', expressionCode.replace(/EXPR/g, expr)),
				noop
			);
		}

		return codeCache[cacheKey];
	}


	var intExprVarCode = 'var NAME;';
	var intExprObserveCode = '__closure__.NAME.call(this, __scope__, function(v) { NAME = v; if (ready) dispatch(); })';
	var intCode =
		'VARS' +
		'var ready = false;' +
		'var cancels = [OBSERVE];' +
		'function dispatch() { __set__(COMPUTE); }' +
		'ready = true;' +
		'dispatch();' +
		'return function() { cancels.forEach(function(cancel) { cancel(); }); };';

	function getInterpolator(text) {
		if (!(text in codeCache)) {
			var closure = {};
			var vars = [];
			var compute = [];
			var observe = [];

			text.split(expressionRE)
				.forEach(function(part, index) {
					if (index % 2) {
						// expression
						var evaluatorName = 'expr' + index;
						var evaluator = getEvaluator(part);

						closure[evaluatorName] = evaluator;

						vars.push(intExprVarCode.replace(/NAME/g, evaluatorName));
						compute.push(evaluatorName);
						observe.push(intExprObserveCode.replace(/NAME/g, evaluatorName));
					} else {
						// text literal
						var textName = 'text' + index;

						closure[textName] = part;

						compute.push('__closure__.' + textName);
					}
				});

			codeCache[text] = new Closure(
				new Function(
					'__closure__,__scope__,__set__',
					intCode
						.replace(/VARS/, vars.join(''))
						.replace(/COMPUTE/, compute.join('+'))
						.replace(/OBSERVE/, observe.join(','))
				),
				closure
			);
		}

		return codeCache[text];
	}



	/*
	 *! Public API
	 */


	var codegen = {};


	codegen.directiveEvaluator = function(node) {
		if (typeof node.expr !== 'undefined') {
			return new Closure(directiveEvaluator, getEvaluator(node.expr));
		} else {
			return undefObserver;
		}
	};


	var attrCode = '__closure__.INT.call(this, __scope__, function(v) { element.setAttribute(__closure__.ATTR, v); });';
	var propCode = '__closure__.INT.call(this, __scope__, function(v) { __closure__.setPath(element, __closure__.PATH, v); });';
	var eventCode = '__closure__.EVAL.call(this, __scope__, function(v) { element.addEventListener(__closure__.EVENT, v, false); });';

	codegen.elementUpdater = function(node) {
		var code = [];
		var attributes = node.attributes;
		var properties = node.properties;
		var events = node.events;
		var closure = {};

		Object.keys(attributes).forEach(function(attr, index) {
			var attrName = 'attr' + index;
			var interpolatorName = 'attrInt' + index;

			closure[attrName] = attr;
			closure[interpolatorName] = getInterpolator(attributes[attr]);

			code.push(attrCode.replace(/ATTR/g, attrName).replace(/INT/g, interpolatorName));
		});

		if (properties.length) {
			closure.setPath = setPath;
		}

		properties.forEach(function(prop, index) {
			var pathName = 'path' + index;
			var interpolatorName = 'pathInt' + index;

			closure[pathName] = prop.path;
			closure[interpolatorName] = getInterpolator(prop.value);

			code.push(propCode.replace(/PATH/g, pathName).replace(/INT/g, interpolatorName));
		});

		Object.keys(events).forEach(function(evt, index) {
			var eventName = 'event' + index;
			closure[eventName] = evt;

			events[evt].forEach(function(expr, eindex) {
				var evaluatorName = 'eventEval' + index + '_' + eindex;
				closure[evaluatorName] = getEvaluator(expr);

				code.push(eventCode.replace(/EVENT/g, eventName).replace(/EVAL/g, evaluatorName));
			});
		});

		return new Closure(
			new Function('__closure__,__scope__,element', code.join('')),
			closure
		);
	};


	codegen.textUpdater = function(node) {
		return new Closure(textUpdater, getInterpolator(node.text));
	};


	return codegen;
});