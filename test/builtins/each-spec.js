/*jshint browser:true*/
/*global define, describe, it, expect */

define(['ist!test/builtins/each/each'], function(tEach) {
	'use strict';
	
	return function() {
		describe('[Builtin @each]', function() {
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
			
			it('should render nodes for each array element in @each directives', function() {
				expect( eachFragment.querySelector('.array').childNodes.length ).toBe( eachObj.array.length );
			});
			
			it('should render an empty document fragment when calling @each with an empty array', function() {
				// Empty except for placeholder comment nodes

				expect( [].slice.call(eachFragment.querySelector('.empty').childNodes)
						  .some(function(child) { return child.nodeType !== document.COMMENT_NODE; })
					).toBe( false );
			});
			
			it('should narrow down context to array element in @each directives', function() {
				eachObj.array.forEach(function(value, index) {
					expect( eachFragment.querySelector('.array').childNodes[index].textContent ).toBe( value );
				});
			});
			
			it('should allow iterating @each directives on nested arrays', function() {
				eachObj.sub.array.forEach(function(value, index) {
					expect( eachFragment.querySelector('.subarray').childNodes[index].textContent ).toBe( value.property );
				});
			});
			
			it('should allow access to loop index as loop.index', function() {
				eachObj.array.forEach(function(value, index) {
					expect( eachFragment.querySelector('.loopindex').childNodes[index].textContent ).toBe( '' + index );
				});
			});
			
			it('should allow access to outer context as loop.outer', function() {
				eachObj.array.forEach(function(value, index) {
					expect( eachFragment.querySelector('.loopouter').childNodes[index].textContent ).toBe( 'value' );
				});
			});
		});
	};
});
