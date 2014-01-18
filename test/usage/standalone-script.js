window.__run__ = function(expect, done) {
	/* Test for ist presence */
	var ist = window.ist;
	expect( typeof ist ).toBe( 'function' );
	expect( typeof ist.create ).toBe( 'function' );
	expect( typeof ist.helper ).toBe( 'function' );

	/* Test template rendering */
	var template = ist("@include 'template1'");
	expect( typeof template.render ).toBe( 'function' );
	
	/* Test script loading */
	template = ist.script("template1");
	expect( typeof template.render ).toBe( 'function' );
	
	/* Test ist.noConflict */
	var ist1 = window.ist,
		ist2 = window.ist.noConflict(),
		ist3 = window.ist;

	var noconflict = { before: ist1, result: ist2, after: ist3 };

	expect( noconflict.before ).toBe( ist );
	expect( noconflict.result ).toBe( ist );
	expect( noconflict.after ).toBe( 'previous ist value' );

	done();
}