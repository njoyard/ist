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
	
	'blocks/included_invalid',
	'ist!blocks/included_ist',
	'text!blocks/included_text.ist',
	'blocks/included_string',
	'blocks/included_compiled'
], function(ist, tIf, tUnless, tWith, tEach, tInclude, textInclude,
			textIncludeText, textIncludeInvalid) {
	describe('blocks', function() {
		var tfObj = {
				zero: 0,
				emptystring: '',
				null: null,
				undefined: undefined,
				false: false,
				number: 12345,
				string: 'string',
				object: { an: 'object' },
				array: [ 'an', 'array' ],
				true: true,
				sub: {
					property1: true,
					property2: false
				}
			},
			falsy = ['zero', 'emptystring', 'null', 'undefined', 'false'],
			truthy = ['number', 'string', 'object', 'array', 'true'],
			ifFragment = tIf.render(tfObj),
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
					sub: { property: 'value' }
				},
				sub: {
					subcontext: {
						value: 'value',
						sub: { property: 'value' }
					},
					rootproperty: 'will not appear'
				},
				rootproperty: 'will not appear'
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
			expect( withNodes[2].textContent ).toBe( '' + undefined );
			expect( withNodes[5].textContent ).toBe( '' + undefined );
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
				empty: []
			},
			eachFragment = tEach.render(eachObj);
		
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
		
		
		/** Common to all directives **/
		
		it("should fail to render when accessing properties of undefined context parts", function() {
			tfObj.sub = undefined;
			expect( function() { tIf.render(tfObj); } ).toThrow( 'Cannot find path sub.property1 in context' );
			expect( function() { tUnless.render(tfObj); } ).toThrow( 'Cannot find path sub.property1 in context' );
			
			withObj.sub = undefined;
			expect( function() { tWith.render(withObj); } ).toThrow( 'Cannot find path sub.subcontext in context' );
			
			eachObj.sub = undefined;
			expect( function() { tEach.render(eachObj); } ).toThrow( 'Cannot find path sub.array in context' );
		});
		
		
		/** @include **/
		
		var inclTextFragment = ist(textIncludeText).render({});
		
		it("should allow including relative template paths when loaded with the ist! plugin", function() {
			var inclFragment = tInclude.render({ variable: 'value' });
			
			expect( inclFragment.querySelector('.parent .included') ).toNotBe( null );
			expect( inclFragment.querySelector('.parent .included .includedchild') ).toNotBe( null );
		});
		
		it("should render includes in current context", function() {
			var inclFragment = tInclude.render({ variable: 'value' });
			
			expect( inclFragment.querySelector('.parent .included .includedchild').firstChild.textContent ).toBe( 'value' );
		});
		
		it("should fail to render templates with missing @include files", function() {
			expect( function() { ist(textInclude).render(); } ).toThrow( "Cannot find included template 'included'" );
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
			expect( function() { ist(textIncludeInvalid).render(); } ).toThrow( "Invalid included template 'blocks/included_invalid'" );
		});
	});
});
