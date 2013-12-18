/*jshint browser:true*/
/*global define, describe, it, expect */

define(['ist!test/builtins/define/define', 'ist!test/builtins/define/notdefined'], function(tDefine, tNotDefined) {
	'use strict';
	
	describe('@define', function() {
		it('should enable @define-ing and @use-ing subtemplates', function() {
			var fragment = tDefine.render();

			expect( fragment.querySelector('.inFoo') ).toNotBe( null );
			expect( fragment.querySelector('.inFoo').firstChild.textContent ).toBe( 'bar' );
		});

		it('should fail to render unknown @use-d subtemplates', function() {
			expect( function() { tNotDefined.render(); } ).toThrow(
				'Template \'not defined\' has not been @defined in \'test/builtins/define/notdefined\' on line 1'
			);
		});
	});
});
