/*jshint browser:true*/
/*global define, describe, it, expect, nthNonCommentChild */

define(['ist!test/builtins/with/with'], function(tWith) {
	'use strict';
	
	describe('@with', function() {
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
			},
			withNodes = tWith.render(withObj);
			
		it('should narrow down context when using a @with directive', function() {
			expect( nthNonCommentChild(withNodes, 0).textContent ).toBe( 'value' );
			expect( nthNonCommentChild(withNodes, 1).textContent ).toBe( 'value' );
		});
		
		it('should be able to access subproperties in @with directive', function() {
			expect( nthNonCommentChild(withNodes, 3).textContent ).toBe( 'value' );
			expect( nthNonCommentChild(withNodes, 4).textContent ).toBe( 'value' );
		});
		
		it('should not able to access root context elements in @with directive', function() {
			expect( nthNonCommentChild(withNodes, 2).textContent ).toBe( 'will appear' );
			expect( nthNonCommentChild(withNodes, 5).textContent ).toBe( 'will appear' );
		});
	});
});
