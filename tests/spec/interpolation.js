define([
	'ist!interpolation/base',
	'ist!interpolation/properties',
	'ist!interpolation/this'
], function(tBase, tProperties, tThis) {
	describe('interpolation', function() {
		var obj = { a: 1, b: '2' },
			propObj = {
				sub: { property: 'value' },
				access: { to: { deeply: { nested: { property: 'value' } } } }
			},
			baseNodes = tBase.render({ variable: 'value', object: obj }).childNodes,
			propNodes = tProperties.render(propObj).childNodes,
			thisNodes = tThis.render('value').childNodes;
		
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
		
		it("should convert non-string variables to string", function() {
			expect( baseNodes[5].getAttribute('attribute') ).toBe( obj.toString() );
		});
		
		it("should interpolate context properties", function() {
			expect( propNodes[0].textContent ).toBe( 'value' );
			expect( propNodes[1].textContent ).toBe( 'value' );
		});
		
		it("should interpolate 'this' as the rendering context itself", function() {
			expect( thisNodes[0].textContent ).toBe( 'value' );
		});
		
		it("should interpolate undefined subproperties as 'undefined'", function() {
			propObj.sub = {};
			expect( tProperties.render(propObj).childNodes[0].textContent ).toBe( '' + undefined );
		});
		
		it("should fail to render when accessing properties of undefined context parts", function() {
			propObj.access = {};
			expect( function() { tProperties.render(propObj); } ).toThrow( 'Cannot find path access.to.deeply.nested.property in context' );
		});
	});
});
