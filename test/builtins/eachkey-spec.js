/*jshint browser:true*/
/*global define, describe, it, expect, nonCommentChildren, nthNonCommentChild */

define(['ist!test/builtins/eachkey/eachkey'], function(tEachKey) {
	'use strict';
	
	describe('@eachkey', function() {
		var eachKeyObj = {
				object: { key1: 'value1', key2: 'value2', key3: 'value3' },
				empty: {},
				variable: 'value'
			};
		var	eachKeyFragment = tEachKey.render(eachKeyObj);
		
		it('should render nodes for each object key in @eachkey directives', function() {
			expect( nonCommentChildren(eachKeyFragment.querySelector('.object')).length ).toBe( Object.keys(eachKeyObj.object).length );
		});
		
		it('should render an empty document fragment when calling @eachkey with an empty object', function() {
			expect( nonCommentChildren(eachKeyFragment.querySelector('.empty')).length ).toBe( 0 );
		});
		
		it('should enable access to keys as key in eachkey directives', function() {
			Object.keys(eachKeyObj.object).forEach(function(key, index) {
				expect( nthNonCommentChild(eachKeyFragment.querySelector('.object'), index).textContent ).toBe( key );
			});
		});
		
		it('should enable access to values as value in eachkey directives', function() {
			Object.keys(eachKeyObj.object).forEach(function(key, index) {
				expect( nthNonCommentChild(eachKeyFragment.querySelector('.objectvalues'), index).textContent ).toBe( eachKeyObj.object[key] );
			});
		});
		
		it('should allow access to loop index as loop.index', function() {
			Object.keys(eachKeyObj.object).forEach(function(key, index) {
				expect(nthNonCommentChild(eachKeyFragment.querySelector('.loopindex'), index).textContent ).toBe( '' + index );
			});
		});
		
		it('should allow access to outer context as loop.outer', function() {
			Object.keys(eachKeyObj.object).forEach(function(key, index) {
				expect( nthNonCommentChild(eachKeyFragment.querySelector('.loopouter'), index).textContent ).toBe( 'value' );
			});
		});
		
		it('should allow access to iterated object as loop.object', function() {
			Object.keys(eachKeyObj.object).forEach(function(key, index) {
				expect( nthNonCommentChild(eachKeyFragment.querySelector('.loopobject'), index).textContent ).toBe( 'value1' );
			});
		});
	});
});
