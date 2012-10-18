define([
	'ist!interpolation/base',
	'ist!interpolation/properties',
	'ist!interpolation/this',
	'ist!interpolation/expressions',
	'ist!interpolation/errors'
], function(tBase, tProperties, tThis, tExpressions, tErrors) {
	return function() {
		var obj = { a: 1, b: '2', aNumber: 1234 },
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
			expect( function() { tProperties.render(propObj); } ).toThrowAny([
				"Cannot read property 'deeply' of undefined in 'interpolation/properties' on line 2",
				"access.to is undefined in 'interpolation/properties' on line 2"
			]);
		});
		
		document.myClassValue = "document property value";
		var exprNodes = tExpressions.render(obj).childNodes;
		
		it("should evaluate expressions", function() {
			expect( exprNodes[0].textContent ).toBe( '' + (1 + 17 - 3 / 2) );
			expect( exprNodes[1].textContent ).toBe( '' + (obj.aNumber + 3) );
		});
		
		it("should allow accessing the rendering document inside expressions using 'document'", function() {
			expect( exprNodes[2].className ).toBe( document.myClassValue + 'suffix' );
		});
		
		it("should execute arbitrary JS code inside expressions", function() {
			expect( exprNodes[3].textContent ).toBe( '' + (Math.PI + (function(arg) { return Array.isArray(arg); })([1, 2])) );
		});
		
		it("should report errors thrown by expressions when rendering", function() {
			expect( function() { tErrors.render({ test: 'syntax' }); } )
				.toThrowAny([
					"Unexpected identifier in 'interpolation/errors' on line 2",
					"missing ; before statement in 'interpolation/errors' on line 2"
				]);
				
			expect( function() { tErrors.render({ test: 'type' }); } )
				.toThrow("a is not defined in 'interpolation/errors' on line 5");
				
			expect( function() { tErrors.render({ test: 'throw' }); } )
				.toThrow("custom error in 'interpolation/errors' on line 8");
		});
	};
});
