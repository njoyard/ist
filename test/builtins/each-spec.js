/*jshint browser:true*/
/*global define, describe, it, expect, nonCommentChildren, nthNonCommentChild */

define(['ist!test/builtins/each/each'], function(tEach) {
	'use strict';
	
	describe('@each', function() {
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
			expect( nonCommentChildren(eachFragment.querySelector('.array')).length ).toBe( eachObj.array.length );
		});
		
		it('should render an empty document fragment when calling @each with an empty array', function() {
			expect( nonCommentChildren(eachFragment.querySelector('.empty')).length ).toBe( 0 );
		});
		
		it('should narrow down context to array element in @each directives', function() {
			eachObj.array.forEach(function(value, index) {
				expect( nthNonCommentChild(eachFragment.querySelector('.array'), index).textContent ).toBe( value );
			});
		});
		
		it('should allow iterating @each directives on nested arrays', function() {
			eachObj.sub.array.forEach(function(value, index) {
				expect( nthNonCommentChild(eachFragment.querySelector('.subarray'), index).textContent ).toBe( value.property );
			});
		});
		
		it('should allow access to loop index as loop.index', function() {
			eachObj.array.forEach(function(value, index) {
				expect( nthNonCommentChild(eachFragment.querySelector('.loopindex'), index).textContent ).toBe( '' + index );
			});
		});
		
		it('should allow access to outer context as loop.outer', function() {
			eachObj.array.forEach(function(value, index) {
				expect( nthNonCommentChild(eachFragment.querySelector('.loopouter'), index).textContent ).toBe( 'value' );
			});
		});
	});
});
