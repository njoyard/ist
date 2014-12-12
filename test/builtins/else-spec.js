/*jshint browser:true*/
/*global define, describe, it, expect */

define([
	'ist!test/builtins/else/else',
	'ist!test/builtins/else/elsif',
	'ist!test/builtins/else/elsunless',
	'ist!test/builtins/else/invalid1',
	'ist!test/builtins/else/invalid2',
	'ist!test/builtins/else/invalid3',
	'ist!test/builtins/else/invalid4',
	'ist!test/builtins/else/invalid5'
], function(tElse, tElsif, tElsunless, tInvalid1, tInvalid2, tInvalid3, tInvalid4, tInvalid5) {
	'use strict';

	describe('@else', function() {
		var elseFragmentTrue = tElse.render({ value: true }),
			elseFragmentFalse = tElse.render({ value: false }),
			elsifFrag1 = tElsif.render({ value: 1 }),
			elsifFrag2 = tElsif.render({ value: 2 }),
			elsifFrag3 = tElsif.render({ value: 3 }),
			elsifFrag4 = tElsif.render({ value: 4 }),
			elsunlessFrag1 = tElsunless.render({ value: 1 }),
			elsunlessFrag2 = tElsunless.render({ value: 2 }),
			elsunlessFrag3 = tElsunless.render({ value: 3 }),
			elsunlessFrag4 = tElsunless.render({ value: 4 });

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

		it('should render the appropriate node in a @if..@elsif..@else structure', function() {
			expect( elsifFrag1.querySelector('.value-1') ).toNotBe( null );
			expect( elsifFrag1.querySelector('.value-2') ).toBe( null );
			expect( elsifFrag1.querySelector('.value-3') ).toBe( null );
			expect( elsifFrag1.querySelector('.value-else') ).toBe( null );

			expect( elsifFrag2.querySelector('.value-1') ).toBe( null );
			expect( elsifFrag2.querySelector('.value-2') ).toNotBe( null );
			expect( elsifFrag2.querySelector('.value-3') ).toBe( null );
			expect( elsifFrag2.querySelector('.value-else') ).toBe( null );

			expect( elsifFrag3.querySelector('.value-1') ).toBe( null );
			expect( elsifFrag3.querySelector('.value-2') ).toBe( null );
			expect( elsifFrag3.querySelector('.value-3') ).toNotBe( null );
			expect( elsifFrag3.querySelector('.value-else') ).toBe( null );

			expect( elsifFrag4.querySelector('.value-1') ).toBe( null );
			expect( elsifFrag4.querySelector('.value-2') ).toBe( null );
			expect( elsifFrag4.querySelector('.value-3') ).toBe( null );
			expect( elsifFrag4.querySelector('.value-else') ).toNotBe( null );
		});

		it('should render the appropriate node in a @if..@elsunless..@else structure', function() {
			expect( elsunlessFrag1.querySelector('.value-1') ).toNotBe( null );
			expect( elsunlessFrag1.querySelector('.value-2') ).toBe( null );
			expect( elsunlessFrag1.querySelector('.value-3') ).toBe( null );
			expect( elsunlessFrag1.querySelector('.value-else') ).toBe( null );

			expect( elsunlessFrag2.querySelector('.value-1') ).toBe( null );
			expect( elsunlessFrag2.querySelector('.value-2') ).toNotBe( null );
			expect( elsunlessFrag2.querySelector('.value-3') ).toBe( null );
			expect( elsunlessFrag2.querySelector('.value-else') ).toBe( null );

			expect( elsunlessFrag3.querySelector('.value-1') ).toBe( null );
			expect( elsunlessFrag3.querySelector('.value-2') ).toBe( null );
			expect( elsunlessFrag3.querySelector('.value-3') ).toNotBe( null );
			expect( elsunlessFrag3.querySelector('.value-else') ).toBe( null );

			expect( elsunlessFrag4.querySelector('.value-1') ).toBe( null );
			expect( elsunlessFrag4.querySelector('.value-2') ).toBe( null );
			expect( elsunlessFrag4.querySelector('.value-3') ).toBe( null );
			expect( elsunlessFrag4.querySelector('.value-else') ).toNotBe( null );
		});

		it('should fail to render invalid @if..@elsif..@else structures', function() {
			expect( function() { tInvalid1.render({ value: 1 }); } ).toThrow(
				'Unexpected @else in \'test/builtins/else/invalid1\' on line 1'
			);

			expect( function() { tInvalid2.render({ value: 1 }); } ).toThrow(
				'Unexpected @else after @with in \'test/builtins/else/invalid2\' on line 3'
			);

			expect( function() { tInvalid3.render({ value: 1 }); } ).toThrow(
				'Unexpected @else after @else in \'test/builtins/else/invalid3\' on line 5'
			);

			expect( function() { tInvalid4.render({ value: 1 }); } ).toThrow(
				'Unexpected @elsif after @else in \'test/builtins/else/invalid4\' on line 5'
			);

			expect( function() { tInvalid5.render({ value: 1 }); } ).toThrow(
				'Unexpected @else in \'test/builtins/else/invalid5\' on line 4'
			);
		});
	});
});