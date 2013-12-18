/*jshint browser:true*/
/*global define, describe, it, expect, runs, waitsFor*/

define([], function() {
	'use strict';

	describe('usage', function() {
		it('should work when loaded as a standalone script', function() {
			var completed = false;
			
			runs(function() {
				var iframe = document.createElement('iframe');
				
				iframe.addEventListener('load', function() {
					var ifw = window.frames.standalone;
				
					if (!ifw) {
						throw new Error('Cannot find standalone iframe');
					}
				
					var ist = ifw.testIstPresent();
					expect( typeof ist ).toBe( 'function' );
					expect( typeof ist.create ).toBe( 'function' );
					expect( typeof ist.helper ).toBe( 'function' );
					
					var template = ifw.testTemplate();
					expect( typeof template.render ).toBe( 'function' );
					
					template = ifw.testFromScript();
					expect( typeof template.render ).toBe( 'function' );
					
					var noconflict = ifw.testNoConflict();
					expect( noconflict.before ).toBe( ist );
					expect( noconflict.result ).toBe( ist );
					expect( noconflict.after ).toBe( 'previous ist value' );
				
					document.body.removeChild(iframe);
					completed = true;
				});
			
				iframe.name = 'standalone';
				iframe.src = 'base/test/usage/standalone.html';
				document.body.appendChild(iframe);
			});
			
			waitsFor(function() { return completed; }, 10000, 'Standalone iframe load timeout');
		});
	});
});
