define([
	'ist!spec/qualifiers/id',
	'ist!spec/qualifiers/class',
	'ist!spec/qualifiers/attributes'
], function(tId, tClass, tAttributes) {
	var idNodes = tId.render().childNodes,
		classNodes = tClass.render().childNodes,
		attrNodes = tAttributes.render().childNodes;
		
	describe('qualifiers', function() {
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
			expect( attrNodes[1].getAttribute('className') ).toBe( "a_class" );
			expect( attrNodes[1].getAttribute('id') ).toBe( "an_id" );
			expect( attrNodes[1].getAttribute('style') ).toBe( "color: red;" );
		});
		
		it("should accept special characters in attribute values", function() {		
			expect( attrNodes[2].getAttribute('anAttribute') ).toBe( "\"{./;}\\/:!*%<>" );
		});
	});
});
