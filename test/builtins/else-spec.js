/*jshint browser:true*/
/*global define, describe, it, expect */

define([
	'ist',
	'ist!test/builtins/else/else',
	'text!test/builtins/else/single.ist',
	'text!test/builtins/else/multiple.ist',
	'text!test/builtins/else/nomatch.ist',
	'text!test/builtins/else/nomatch2.ist'
], function(ist, tElse, single, multiple, nomatch, nomatch2) {
	'use strict';
	
	describe('@else', function() {
		var elseFragmentTrue = tElse.render({ value: true }),
			elseFragmentFalse = tElse.render({ value: false });

		it('should render nodes under @else directives if a matching @if wasn\'t rendered', function() {
			expect( elseFragmentFalse.querySelector('.if-false') ).toNotBe( null );
		});

		it('should not render nodes under @else directives if a matching @if was rendered', function() {
			expect( elseFragmentTrue.querySelector('.if-false') ).toBe( null );
		});

		it('should render nodes under @else directives if a matching @unless wasn\'t rendered', function() {
			expect( elseFragmentTrue.querySelector('.unless-true') ).toNotBe( null );
		});

		it('should not render nodes under @else directives if a matching @unless was rendered', function() {
			expect( elseFragmentFalse.querySelector('.unless-true') ).toBe( null );
		});

		it('should fail to compile templates with @else directive that don\'t match a @if or @unless directive', function() {
			expect( function() { ist(single); } ).toThrow(
				'@else directive has no matching @if or @unless directive in \'<unknown>\' on line 1'
			);

			expect( function() { ist(multiple); } ).toThrow(
				'@else directive has no matching @if or @unless directive in \'<unknown>\' on line 5'
			);

			expect( function() { ist(nomatch); } ).toThrow(
				'@else directive has no matching @if or @unless directive in \'<unknown>\' on line 3'
			);

			expect( function() { ist(nomatch2); } ).toThrow(
				'@else directive has no matching @if or @unless directive in \'<unknown>\' on line 2'
			);
		});
	});
});