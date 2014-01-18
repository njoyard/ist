/*jshint browser:true*/
/*global define, describe, it, expect */

define(['ist!test/builtins/eachkey/eachkey'], function(tEachKey) {
	'use strict';
	
	return function() {
		describe('[Builtin @eachkey]', function() {
			var eachKeyObj = {
					object: { key1: 'value1', key2: 'value2', key3: 'value3' },
					empty: {},
					variable: 'value'
				};
			var	eachKeyFragment = tEachKey.render(eachKeyObj);
			
			it('should render nodes for each object key in @eachkey directives', function() {
				expect( eachKeyFragment.querySelector('.object').childNodes.length ).toBe( Object.keys(eachKeyObj.object).length );
			});
			
			it('should render an empty document fragment when calling @eachkey with an empty object', function() {
				// Empty except for placeholder comment nodes

				expect( [].slice.call(eachKeyFragment.querySelector('.empty').childNodes)
						  .some(function(child) { return child.nodeType !== document.COMMENT_NODE; })
					).toBe( false );
			});
			
			it('should enable access to keys as key in eachkey directives', function() {
				Object.keys(eachKeyObj.object).forEach(function(key, index) {
					expect( eachKeyFragment.querySelector('.object').childNodes[index].textContent ).toBe( key );
				});
			});
			
			it('should enable access to values as value in eachkey directives', function() {
				Object.keys(eachKeyObj.object).forEach(function(key, index) {
					expect( eachKeyFragment.querySelector('.objectvalues').childNodes[index].textContent ).toBe( eachKeyObj.object[key] );
				});
			});
			
			it('should allow access to loop index as loop.index', function() {
				Object.keys(eachKeyObj.object).forEach(function(key, index) {
					expect( eachKeyFragment.querySelector('.loopindex').childNodes[index].textContent ).toBe( '' + index );
				});
			});
			
			it('should allow access to outer context as loop.outer', function() {
				Object.keys(eachKeyObj.object).forEach(function(key, index) {
					expect( eachKeyFragment.querySelector('.loopouter').childNodes[index].textContent ).toBe( 'value' );
				});
			});
			
			it('should allow access to iterated object as loop.object', function() {
				Object.keys(eachKeyObj.object).forEach(function(key, index) {
					expect( eachKeyFragment.querySelector('.loopobject').childNodes[index].textContent ).toBe( 'value1' );
				});
			});
		});
	};
});
