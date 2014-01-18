/*jshint browser:true*/
/*global define, describe, it, expect, renderAndGetNode */

define(['ist!test/builtins/with/with'], function(tWith) {
	'use strict';
	
	return function() {
		describe('[Builtin @with]', function() {
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
				};
				
			it('should narrow down context when using a @with directive', function() {
				expect( renderAndGetNode(tWith, withObj, 0).textContent ).toBe( 'value' );
				expect( renderAndGetNode(tWith, withObj, 1).textContent ).toBe( 'value' );
			});
			
			it('should be able to access subproperties in @with directive', function() {
				expect( renderAndGetNode(tWith, withObj, 3).textContent ).toBe( 'value' );
				expect( renderAndGetNode(tWith, withObj, 4).textContent ).toBe( 'value' );
			});
			
			it('should not able to access root context elements in @with directive', function() {
				expect( renderAndGetNode(tWith, withObj, 2).textContent ).toBe( 'will appear' );
				expect( renderAndGetNode(tWith, withObj, 5).textContent ).toBe( 'will appear' );
			});
		});
	};
});
