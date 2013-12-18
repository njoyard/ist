/*jshint browser:true*/
/*global define, describe, it, expect */

define(['ist!test/builtins/unless/unless'], function(tUnless) {
	'use strict';
	
	describe('@unless', function() {
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
			truthy = ['number', 'string', 'object', 'array', '_true'];
			
		var unlessFragment = tUnless.render(tfObj);
			
		/** @unless **/
			
		it('should not render nodes under @unless directives when the condition is truthy', function() {
			truthy.forEach(function(key) {
				expect( unlessFragment.querySelector('.' + key) ).toBe( null );
			});
		});
		
		it('should render nodes under @unless directives when the condition is falsy', function() {
			falsy.forEach(function(key) {
				expect( unlessFragment.querySelector('.' + key) ).toNotBe( null );
			});
		});
		
		it('should consider missing properties as falsy', function() {
			expect( unlessFragment.querySelector('.subundefined') ).toNotBe( null );
		});
	});
});
