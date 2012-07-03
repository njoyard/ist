define([
	'ist!qualifiers/id',
	'ist!qualifiers/class',
	'ist!qualifiers/attributes',
	'ist!qualifiers/properties',
	'ist!qualifiers/mixed'
], function(tId, tClass, tAttributes, tProperties, tMixed) {
	var idNodes = tId.render().childNodes,
		classNodes = tClass.render().childNodes,
		attrNodes = tAttributes.render().childNodes,
		propNodes = tProperties.render().childNodes,
		mixedNodes = tMixed.render().childNodes;
		
	return function() {
		it("should be able to set an ID on elements", function() {
			expect( idNodes[0].id ).toBe("id");
		});
		
		it("should use the last one when multiple IDs are present", function() {
			expect( idNodes[1].id ).toBe("idtwo");
		});
		
		it("should be able to set a class on elements", function() {
			expect( classNodes[0].classList.contains('class') ).toBe( true );
		});
		
		it("should be able to set multiple classes on elements", function() {
			expect( classNodes[1].classList.contains('classone') ).toBe( true );
			expect( classNodes[1].classList.contains('classtwo') ).toBe( true );
		});
		
		it("should be able to set random attributes on elements", function() {
			expect( attrNodes[0].getAttribute('anAttribute') ).toBe( "a value" );
		});
		
		it("should be able to set multiple attributes on elements", function() {
			expect( attrNodes[1].getAttribute('class') ).toBe( "a_class" );
			expect( attrNodes[1].getAttribute('id') ).toBe( "an_id" );
			expect( attrNodes[1].getAttribute('style') ).toBe( "color: red;" );
		});
		
		it("should accept special characters in attribute values", function() {		
			expect( attrNodes[2].getAttribute('anAttribute') ).toBe( "\"{./;}\\/:!*%<>" );
		});

		it("should be able to set random properties on elements", function() {
			expect( propNodes[0].aProperty ).toBe( "a value" );
		});
		
		it("should be able to set multiple properties on elements", function() {
			expect( propNodes[1].className ).toBe( "a_class" );
			expect( propNodes[1].id ).toBe( "an_id" );
			expect( propNodes[1].prop ).toBe( "val" );
		});
		
		it("should accept special characters in property values", function() {		
			expect( propNodes[2].aProperty ).toBe( "\"{./;}\\/:!*%<>" );
		});
		
		it("should handle qualifiers in any order", function() {
			expect( mixedNodes[0].classList.contains('class') ).toBe( true );
			expect( mixedNodes[0].classList.contains('class2') ).toBe( true );
			expect( mixedNodes[0].id ).toBe( 'idtwo' );
			expect( mixedNodes[0].getAttribute('style') ).toBe( "display: none;" );
			expect( mixedNodes[0].getAttribute('test') ).toBe( "test \"value\"" );
			expect( mixedNodes[0].prop ).toBe( "val" );
		});
	};
});
