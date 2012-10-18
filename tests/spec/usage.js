define([], function() {
	return function() {
		it("should work when loaded as a standalone script", function() {
			var completed = false;
			
			runs(function() {
				var iframe = document.createElement('iframe');
				
				iframe.addEventListener('load', function() {
					var ifw = window.frames['standalone'];
				
					if (!ifw) {
						throw new Error('Cannot find standalone iframe');
					}
				
					var ist = ifw.testIstPresent();
					expect( typeof ist ).toBe( 'function' );
					expect( typeof ist.createNode ).toBe( 'function' );
					expect( typeof ist.registerHelper ).toBe( 'function' );
					
					var template = ifw.testTemplate();
					expect( typeof template.render ).toBe( 'function' );
					
					var noconflict = ifw.testNoConflict();
					expect( noconflict.before ).toBe( ist );
					expect( noconflict.result ).toBe( ist );
					expect( noconflict.after ).toBe( "previous ist value" );
				
					document.body.removeChild(iframe);
					completed = true;
				});
			
				iframe.name = 'standalone';
				iframe.src = 'spec/usage/standalone.html';
				document.body.appendChild(iframe);
			});
			
			waitsFor(function() { return completed; }, 10000, 'Standalone iframe load timeout');
		});
	};
});
