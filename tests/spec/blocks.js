define([
	'ist',
	'ist!blocks/if',
	'ist!blocks/unless',
	'ist!blocks/with',
	'ist!blocks/each',
	'ist!blocks/include',
	'text!blocks/include.ist',
	'text!blocks/includetext.ist',
	'text!blocks/includeinvalid.ist',
	'ist!blocks/errors',
	
	'blocks/included_invalid',
	'ist!blocks/included_ist',
	'text!blocks/included_text.ist',
	'blocks/included_string',
	'blocks/included_compiled'
], function(ist, tIf, tUnless, tWith, tEach, tInclude, textInclude,
			textIncludeText, textIncludeInvalid, tErrors) {
	return function() {
		var tfObj = {
				zero: 0,
				emptystring: '',
				_null: null,
				_undefined: undefined,
				_false: false,
				number: 12345,
				string: 'string',
				object: { an: 'object' },
				array: [ 'an', 'array' ],
				_true: true,
				sub: {
					property1: true,
					property2: false
				}
			},
			falsy = ['zero', 'emptystring', '_null', '_undefined', '_false'],
			truthy = ['number', 'string', 'object', 'array', '_true'],
			ifFragment, unlessFragment;
			
		ifFragment = tIf.render(tfObj)
		unlessFragment = tUnless.render(tfObj);
			
			
		/** @if **/
		
		it("should render nodes under @if directives when the condition is truthy", function() {
			truthy.forEach(function(key) {
				expect( ifFragment.querySelector('.' + key) ).toNotBe( null );
			});
		});
		
		it("should not render nodes under @if directives when the condition is falsy", function() {
			falsy.forEach(function(key) {
				expect( ifFragment.querySelector('.' + key) ).toBe( null );
			});
		});
		
		it("should be able to access context subproperties in @if conditions", function() {
			expect( ifFragment.querySelector('.subproperty1') ).toNotBe( null );
			expect( ifFragment.querySelector('.subproperty2') ).toBe( null );
		});
		
			
		/** @unless **/
			
		it("should not render nodes under @unless directives when the condition is truthy", function() {
			truthy.forEach(function(key) {
				expect( unlessFragment.querySelector('.' + key) ).toBe( null );
			});
		});
		
		it("should render nodes under @unless directives when the condition is falsy", function() {
			falsy.forEach(function(key) {
				expect( unlessFragment.querySelector('.' + key) ).toNotBe( null );
			});
		});
		
		it("should be able to access context subproperties in @unless conditions", function() {
			expect( unlessFragment.querySelector('.subproperty1') ).toBe( null );
			expect( unlessFragment.querySelector('.subproperty2') ).toNotBe( null );
		});
		
		
		/** @if/@unless common **/
		
		it("should consider missing properties as falsy", function() {
			expect( ifFragment.querySelector('.subundefined') ).toBe( null );
			expect( unlessFragment.querySelector('.subundefined') ).toNotBe( null );
		});
		
		
		/** @with **/
		
		var withObj = {
				subcontext: {
					value: 'value',
					sub: { property: 'value' },
					prop: 'will appear'
				},
				sub: {
					subcontext: {
						value: 'value',
						sub: { property: 'value' },
						prop: 'will appear'
					},
					prop: 'will not appear'
				},
				prop: 'will not appear'
			},
			withNodes = tWith.render(withObj).childNodes;
			
		it("should narrow down context when using a @with directive", function() {
			expect( withNodes[0].textContent ).toBe( 'value' );
			expect( withNodes[1].textContent ).toBe( 'value' );
		});
		
		it("should be able to access subproperties in @with directive", function() {
			expect( withNodes[3].textContent ).toBe( 'value' );
			expect( withNodes[4].textContent ).toBe( 'value' );
		});
		
		it("should not able to access root context elements in @with directive", function() {
			expect( withNodes[2].textContent ).toBe( 'will appear' );
			expect( withNodes[5].textContent ).toBe( 'will appear' );
		});
		
		
		/** @each **/
		
		var eachObj = {
				array: [ 'item 1', 'item 2', 'item 3', 'item 4', 'item 5' ],
				sub: {
					array: [
						{ property: 'item 1' },
						{ property: 'item 2' },
						{ property: 'item 3' },
						{ property: 'item 4' },
						{ property: 'item 5' }
					]
				},
				empty: [],
				variable: 'value'
			};
		var	eachFragment = tEach.render(eachObj);
		
		it("should render nodes for each array element in @each directives", function() {
			expect( eachFragment.querySelector('.array').childNodes.length ).toBe( eachObj.array.length );
		});
		
		it("should render an empty document fragment when calling @each with an empty array", function() {
			expect( eachFragment.querySelector('.empty').childNodes.length ).toBe( 0 );
		});
		
		it("should narrow down context to array element in @each directives", function() {
			eachObj.array.forEach(function(value, index) {
				expect( eachFragment.querySelector('.array').childNodes[index].textContent ).toBe( value );
			});
		});
		
		it("should allow iterating @each directives on nested arrays", function() {
			eachObj.sub.array.forEach(function(value, index) {
				expect( eachFragment.querySelector('.subarray').childNodes[index].textContent ).toBe( value.property );
			});
		});
		
		it("should allow access to loop index as loop.index", function() {
			eachObj.array.forEach(function(value, index) {
				expect( eachFragment.querySelector('.loopindex').childNodes[index].textContent ).toBe( '' + index );
			});
		});
		
		it("should allow access to outer context as loop.outer", function() {
			eachObj.array.forEach(function(value, index) {
				expect( eachFragment.querySelector('.loopouter').childNodes[index].textContent ).toBe( 'value' );
			});
		});
		
		/** Common to all directives **/
		
		it("should fail to render when accessing properties of undefined context parts", function() {
			tfObj.sub = undefined;
			expect( function() { tIf.render(tfObj); } ).toThrowAny([
				"Cannot read property 'property1' of undefined in 'blocks/if' on line 21",
				"sub is undefined in 'blocks/if' on line 21",
				"'undefined' is not an object (evaluating 'sub.property1') in 'blocks/if' on line 21"
			]);
			expect( function() { tUnless.render(tfObj); } ).toThrowAny([
				"Cannot read property 'property1' of undefined in 'blocks/unless' on line 21",
				"sub is undefined in 'blocks/unless' on line 21",
				"'undefined' is not an object (evaluating 'sub.property1') in 'blocks/unless' on line 21"
			]);
			
			withObj.sub = undefined;
			expect( function() { tWith.render(withObj); } ).toThrowAny([
				"Cannot read property 'subcontext' of undefined in 'blocks/with' on line 6",
				"sub is undefined in 'blocks/with' on line 6",
				"'undefined' is not an object (evaluating 'sub.subcontext') in 'blocks/with' on line 6"
			]);
			
			eachObj.sub = undefined;
			expect( function() { tEach.render(eachObj); } ).toThrowAny([
				"Cannot read property 'array' of undefined in 'blocks/each' on line 6",
				"sub is undefined in 'blocks/each' on line 6",
				"'undefined' is not an object (evaluating 'sub.array') in 'blocks/each' on line 6"
			]);
		});
		
		
		/** @include **/
		
		var inclTextFragment = ist(textIncludeText).render({});
		
		it("should allow including relative template paths when loaded with the ist! plugin", function() {
			var inclFragment = tInclude.render({ variable: 'value' });
			
			expect( inclFragment.querySelector('.parent .included') ).toNotBe( null );
			expect( inclFragment.querySelector('.parent .included .includedchild') ).toNotBe( null );
		});
		
		it("should allow including templates from <script type=\"text/x-ist\" id=\"...\"> tags", function() {
			var inclFragment = tInclude.render({ variable: 'value' });
			
			expect( inclFragment.querySelector('.parent .insideScriptTag' ) ).toNotBe( null );
			expect( inclFragment.querySelector('.parent .insideScriptTag .child' ) ).toNotBe( null );
			expect( inclFragment.querySelector('.parent .insideScriptTag .child .conditional' ) ).toNotBe( null );
		});
		
		it("should render includes in current context", function() {
			var inclFragment = tInclude.render({ variable: 'value' });
			
			expect( inclFragment.querySelector('.parent .included .includedchild').firstChild.textContent ).toBe( 'value' );
		});
		
		it("should fail to render templates with missing @include files/<script> tags", function() {
			expect( function() { ist(textInclude).render(); } ).toThrow( "Cannot find included template 'included' in '<unknown>' on line 2" );
		});
		
		it("should use templates previously loaded with the ist! plugin when rendering a string template", function() {
			expect( inclTextFragment.querySelector(".elements1 .included") ).toNotBe( null );
			expect( inclTextFragment.querySelector(".elements2 .included") ).toNotBe( null );
		});
		
		it("should use templates previously loaded as text when rendering a string template", function() {
			expect( inclTextFragment.querySelector(".elements3 .included") ).toNotBe( null );
			expect( inclTextFragment.querySelector(".elements4 .included") ).toNotBe( null );
		});
		
		it("should use previously loaded modules resolving to compiled templates when rendering a string template", function() {
			expect( inclTextFragment.querySelector(".elements5 .included") ).toNotBe( null );
		});
		
		it("should use previously loaded modules resolving to template strings when rendering a string template", function() {
			expect( inclTextFragment.querySelector(".elements6 .included") ).toNotBe( null );
		});
		
		it("should fail to render templates with invalid includes", function() {
			expect( function() { ist(textIncludeInvalid).render(); } ).toThrow( "Invalid included template 'blocks/included_invalid' in '<unknown>' on line 1" );
		});
		
		
		
		it("should report errors thrown by expressions when rendering", function() {
			expect( function() { tErrors.render({ test: 'syntax' }); } )
				.toThrowAny([
					"Unexpected identifier in 'blocks/errors' on line 2",
					"missing ; before statement in 'blocks/errors' on line 2",
					"Expected an identifier but found 'error' instead in 'blocks/errors' on line 2"
				]);
				
			expect( function() { tErrors.render({ test: 'type' }); } )
				.toThrowAny([
					"a is not defined in 'blocks/errors' on line 6",
					"Can't find variable: a in 'blocks/errors' on line 6"
				]);
				
			expect( function() { tErrors.render({ test: 'throw' }); } )
				.toThrow("custom error in 'blocks/errors' on line 10");
		});
	};
});
