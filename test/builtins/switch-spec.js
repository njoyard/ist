/*jshint browser:true */
/*global define, describe, it, expect, nthNonCommentChild, nonCommentChildren */

define([
  'ist!test/builtins/switch/switch',
  'ist!test/builtins/switch/default',
  'ist!test/builtins/switch/duplicate',
  'ist!test/builtins/switch/empty',
  'ist!test/builtins/switch/consecutive',
  'ist!test/builtins/switch/invalid1',
  'ist!test/builtins/switch/invalid2',
  'ist!test/builtins/switch/invalid3',
  'ist!test/builtins/switch/invalid4',
  'ist!test/builtins/switch/invalid5'
], function(tSwitch, tDefault, tDuplicate, tEmpty, tConsecutive, tInvalid1, tInvalid2, tInvalid3, tInvalid4, tInvalid5) {
  'use strict';

  describe('@switch', function() {
    it('should only render the matching @case block', function() {
      var rendered = tSwitch.render({ value: 1 });
      expect( nonCommentChildren(rendered).length ).toBe( 1 );
      expect( nthNonCommentChild(rendered, 0).textContent ).toBe( 'value is 1' );

      rendered = tSwitch.render({ value: 2 });
      expect( nonCommentChildren(rendered).length ).toBe( 1 );
      expect( nthNonCommentChild(rendered, 0).textContent ).toBe( 'value is 2' );
    });

    it('should not render anything when no @case matches', function() {
      var rendered = tSwitch.render({ value: 3 });
      expect( nonCommentChildren(rendered).length ).toBe( 0 );
    });

    it('should only render the @default block when no @case matches', function() {
      var rendered = tDefault.render({ value: 1 });
      expect( nonCommentChildren(rendered).length ).toBe( 1 );
      expect( nthNonCommentChild(rendered, 0).textContent ).toBe( 'value is 1' );

      rendered = tDefault.render({ value: 2 });
      expect( nonCommentChildren(rendered).length ).toBe( 1 );
      expect( nthNonCommentChild(rendered, 0).textContent ).toBe( 'value is 2' );

      rendered = tDefault.render({ value: 3 });
      expect( nonCommentChildren(rendered).length ).toBe( 1 );
      expect( nthNonCommentChild(rendered, 0).textContent ).toBe( 'value is other' );
    });

    it('should only render the first matching @case', function() {
      var rendered = tDuplicate.render({ value: 1 });
      expect( nonCommentChildren(rendered).length ).toBe( 1 );
      expect( nthNonCommentChild(rendered, 0).textContent ).toBe( 'value is 1' );
    });

    it('should not render any child of the @switch block', function() {
      var rendered = tEmpty.render({ value: 1 });
      expect( nonCommentChildren(rendered).length ).toBe( 0 );
    });

    it('should render consecutive @switch structures correctly', function() {
      var rendered = tConsecutive.render({ value1: 1, value2: 2 });
      expect( nonCommentChildren(rendered).length ).toBe( 2 );
      expect( nthNonCommentChild(rendered, 0).textContent ).toBe( 'value1 is 1' );
      expect( nthNonCommentChild(rendered, 1).textContent ).toBe( 'value2 is 2' );
    });

    it('should fail to render invalid structures', function() {
      expect( function() { tInvalid1.render({ value: 1 }); } ).toThrow(
        'Unexpected @case after @default in \'test/builtins/switch/invalid1\' on line 4'
      );
      expect( function() { tInvalid2.render({ value: 1 }); } ).toThrow(
        'Unexpected @case in \'test/builtins/switch/invalid2\' on line 1'
      );
      expect( function() { tInvalid3.render({ value: 1 }); } ).toThrow(
        'Unexpected @default in \'test/builtins/switch/invalid3\' on line 1'
      );
      expect( function() { tInvalid4.render({ value: 1 }); } ).toThrow(
        'Unexpected @case after @if in \'test/builtins/switch/invalid4\' on line 3'
      );
      expect( function() { tInvalid5.render({ value: 1 }); } ).toThrow(
        'Unexpected @default after @if in \'test/builtins/switch/invalid5\' on line 3'
      );
    });
  });
});