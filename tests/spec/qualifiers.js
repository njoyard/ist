define([
	'ist!qualifiers/id',
	'ist!qualifiers/class',
	'ist!qualifiers/attributes',
	'ist!qualifiers/properties',
	'ist!qualifiers/mixed',
	'ist!qualifiers/implicit',
	'ist!qualifiers/partials'
], function(tId, tClass, tAttributes, tProperties, tMixed, tImplicit, tPartial) {
	var idNodes = tId.render().childNodes,
		classNodes = tClass.render().childNodes,
		attrNodes = tAttributes.render().childNodes,
		propNodes = tProperties.render().childNodes,
		mixedNodes = tMixed.render().childNodes,
		implicitNodes = tImplicit.render().childNodes;
		
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
		
		it("should allow implicit div creation with qualifiers only", function() {
			expect( implicitNodes[0].tagName.toLowerCase() ).toBe( "div" );
			expect( implicitNodes[0].id ).toBe( "implicitId" );
			
			expect( implicitNodes[1].tagName.toLowerCase() ).toBe( "div" );
			expect( implicitNodes[1].className ).toBe( "implicitClass" );
			
			expect( implicitNodes[2].tagName.toLowerCase() ).toBe( "div" );
			expect( implicitNodes[2].getAttribute( 'implicitAttribute' ) ).toBe( "value" );
			
			expect( implicitNodes[3].tagName.toLowerCase() ).toBe( "div" );
			expect( implicitNodes[3].implicitProperty ).toBe( "value" );
			
			expect( implicitNodes[4].tagName.toLowerCase() ).toBe( "div" );
			expect( implicitNodes[4].id ).toBe( "implicitMultiple" );
			expect( implicitNodes[4].className ).toBe( "class" );
			expect( implicitNodes[4].getAttribute( 'attr' ) ).toBe( "value" );
			expect( implicitNodes[4].prop ).toBe( "value" );
		});
		
		it("should allow accessing partials", function() {
			expect( typeof tPartial.findPartial ).toBe( 'function' );
			expect( tPartial.findPartial('unknown') ).toBe( null );
			
			var level1 = tPartial.findPartial('level_1_partial');
			var level2 = tPartial.findPartial('level_2_partial');
			var level3 = tPartial.findPartial('level_3_partial');
			
			expect( typeof level1.render ).toBe( 'function' );
			expect( typeof level2.render ).toBe( 'function' );
			expect( typeof level3.render ).toBe( 'function' );
			
			var node1 = level1.render()
			var node2 = level2.render();
			var node3 = level3.render();
			
			expect( node1.tagName.toLowerCase() ).toBe( 'div' );
			expect( node1.classList.contains('level1') ).toBe( true );
			expect( node2.tagName.toLowerCase() ).toBe( 'div' );
			expect( node2.classList.contains('level2') ).toBe( true );
			expect( node3.tagName.toLowerCase() ).toBe( 'div' );
			expect( node3.classList.contains('level3') ).toBe( true );
		});
	};
});
