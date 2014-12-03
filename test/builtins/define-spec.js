/*jshint browser:true*/
/*global define, describe, it, expect */

define(
['ist!test/builtins/define/define', 'ist!test/builtins/define/notdefined', 'ist!test/builtins/define/update-bug'],
function(tDefine, tNotDefined, tUpdateBug) {
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

		it('should update correctly', function() {
			var fragment = tUpdateBug.render();
			var container = document.createElement('div');
			container.appendChild(fragment);

			expect( container.querySelector('.content') ).toNotBe( null );

			fragment.update();

			expect( container.querySelector('.content') ).toNotBe( null );

			fragment.update();

			expect( container.querySelector('.content') ).toNotBe( null );
		});
	});
});
