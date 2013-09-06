define(['ist!builtins/with/with'], function(tWith) {
	return function() {
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
			withNodes = tWith.render(withObj).childNodes;
			
		it("should narrow down context when using a @with directive", function() {
			expect( withNodes[0].textContent ).toBe( 'value' );
			expect( withNodes[1].textContent ).toBe( 'value' );
		});
		
		it("should be able to access subproperties in @with directive", function() {
			expect( withNodes[3].textContent ).toBe( 'value' );
			expect( withNodes[4].textContent ).toBe( 'value' );
		});
		
		it("should not able to access root context elements in @with directive", function() {
			expect( withNodes[2].textContent ).toBe( 'will appear' );
			expect( withNodes[5].textContent ).toBe( 'will appear' );
		});
	};
});
