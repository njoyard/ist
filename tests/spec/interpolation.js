define([
	'ist!interpolation/base'
], function(tBase) {
	describe('interpolation', function() {
		var baseNodes = tBase.render({ variable: 'value' }).childNodes;
		
		it("should interpolate variables in text nodes", function() {
			expect( baseNodes[0].textContent ).toBe( 'before value after' );
		});
		
		it("should interpolate variables in attribute values", function() {
			expect( baseNodes[1].getAttribute('attribute') ).toBe( 'before value after' );
		});
		
		it("should interpolate variables in property values", function() {
			expect( baseNodes[2].property ).toBe( 'before value after' );
		});
		
		it("should ignore space inside interpolation braces", function() {
			expect( baseNodes[3].textContent ).toBe( 'value' );
			expect( baseNodes[4].textContent ).toBe( 'value' );
		});
	});
});
