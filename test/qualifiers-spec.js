/*jshint browser:true*/
/*global define, describe, it, expect, renderAndGetNode */

define([
	'ist!test/qualifiers/id',
	'ist!test/qualifiers/class',
	'ist!test/qualifiers/attributes',
	'ist!test/qualifiers/properties',
	'ist!test/qualifiers/eventHandlers',
	'ist!test/qualifiers/mixed',
	'ist!test/qualifiers/implicit',
	'ist!test/qualifiers/partials',
	'ist!test/qualifiers/inlineText'
], function(tId, tClass, tAttributes, tProperties, tEventHandlers, tMixed, tImplicit, tPartial, tInlineText) {
	'use strict';
		
	describe('qualifiers', function() {
		it('should be able to set an ID on elements', function() {
			expect( renderAndGetNode(tId, undefined, 0).id ).toBe('id');
		});
		
		it('should use the last one when multiple IDs are present', function() {
			expect( renderAndGetNode(tId, undefined, 1).id ).toBe('idtwo');
		});
		
		it('should be able to set a class on elements', function() {
			expect( renderAndGetNode(tClass, undefined, 0).classList.contains('class') ).toBe( true );
		});
		
		it('should be able to set multiple classes on elements', function() {
			expect( renderAndGetNode(tClass, undefined, 1).classList.contains('classone') ).toBe( true );
			expect( renderAndGetNode(tClass, undefined, 1).classList.contains('classtwo') ).toBe( true );
		});
		
		it('should be able to set random attributes on elements', function() {
			expect( renderAndGetNode(tAttributes, undefined, 0).getAttribute('anAttribute') ).toBe( 'a value' );
		});
		
		it('should be able to set multiple attributes on elements', function() {
			expect( renderAndGetNode(tAttributes, undefined, 1).getAttribute('class') ).toBe( 'a_class' );
			expect( renderAndGetNode(tAttributes, undefined, 1).getAttribute('id') ).toBe( 'an_id' );
			expect( renderAndGetNode(tAttributes, undefined, 1).getAttribute('style') ).toBe( 'color: red;' );
		});
		
		it('should accept special characters in attribute values', function() {
			expect( renderAndGetNode(tAttributes, undefined, 2).getAttribute('anAttribute') ).toBe( '"{./;}:!*%<>' );
		});
		
		it('should accept escaped characters in attribute values', function() {
			expect( renderAndGetNode(tAttributes, undefined, 3).getAttribute('anAttribute') ).toBe( '\\"aéé\n]' );
		});

		it('should be able to set random properties on elements', function() {
			expect( renderAndGetNode(tProperties, undefined, 0).aProperty ).toBe( 'a value' );
		});
		
		it('should be able to set multiple properties on elements', function() {
			expect( renderAndGetNode(tProperties, undefined, 1).className ).toBe( 'a_class' );
			expect( renderAndGetNode(tProperties, undefined, 1).id ).toBe( 'an_id' );
			expect( renderAndGetNode(tProperties, undefined, 1).prop ).toBe( 'val' );
		});
		
		it('should accept special characters in property values', function() {
			expect( renderAndGetNode(tProperties, undefined, 2).aProperty ).toBe( '"{./;}:!*%<>' );
		});
		
		it('should accept escaped characters in property values', function() {
			expect( renderAndGetNode(tProperties, undefined, 3).aProperty ).toBe( '\\"aéé\n]' );
		});

        it('should be able to set property paths on elements', function() {
                expect( typeof renderAndGetNode(tProperties, undefined, 4).property ).toBe( 'object' );
                expect( renderAndGetNode(tProperties, undefined, 4).property.path ).toBe( 'a value' );
        });
		
		it('should be able to set event handlers on elements', function() {
			var called = false;
			
			tEventHandlers.render({ handler: function() { called = true; } });
			expect( called ).toBe( true );
		});
		
		it('should handle qualifiers in any order', function() {
			expect( renderAndGetNode(tMixed, undefined, 0).classList.contains('class') ).toBe( true );
			expect( renderAndGetNode(tMixed, undefined, 0).classList.contains('class2') ).toBe( true );
			expect( renderAndGetNode(tMixed, undefined, 0).id ).toBe( 'idtwo' );
			expect( renderAndGetNode(tMixed, undefined, 0).getAttribute('style') ).toBe( 'display: none;' );
			expect( renderAndGetNode(tMixed, undefined, 0).getAttribute('test') ).toBe( 'test "value"' );
			expect( renderAndGetNode(tMixed, undefined, 0).prop ).toBe( 'val' );
		});
		
		it('should allow implicit div creation with qualifiers only', function() {
			expect( renderAndGetNode(tImplicit, undefined, 0).tagName.toLowerCase() ).toBe( 'div' );
			expect( renderAndGetNode(tImplicit, undefined, 0).id ).toBe( 'implicitId' );
			
			expect( renderAndGetNode(tImplicit, undefined, 1).tagName.toLowerCase() ).toBe( 'div' );
			expect( renderAndGetNode(tImplicit, undefined, 1).className ).toBe( 'implicitClass' );
			
			expect( renderAndGetNode(tImplicit, undefined, 2).tagName.toLowerCase() ).toBe( 'div' );
			expect( renderAndGetNode(tImplicit, undefined, 2).getAttribute( 'implicitAttribute' ) ).toBe( 'value' );
			
			expect( renderAndGetNode(tImplicit, undefined, 3).tagName.toLowerCase() ).toBe( 'div' );
			expect( renderAndGetNode(tImplicit, undefined, 3).implicitProperty ).toBe( 'value' );
			
			expect( renderAndGetNode(tImplicit, undefined, 4).tagName.toLowerCase() ).toBe( 'div' );
			expect( renderAndGetNode(tImplicit, undefined, 4).id ).toBe( 'implicitMultiple' );
			expect( renderAndGetNode(tImplicit, undefined, 4).className ).toBe( 'class' );
			expect( renderAndGetNode(tImplicit, undefined, 4).getAttribute( 'attr' ) ).toBe( 'value' );
			expect( renderAndGetNode(tImplicit, undefined, 4).prop ).toBe( 'value' );
		});
		
		it('should allow accessing partials', function() {
			expect( typeof tPartial.partial ).toBe( 'function' );
			expect( typeof tPartial.partial('unknown') ).toBe( 'undefined' );
			
			var level1 = tPartial.partial('level_1_partial');
			var level2 = tPartial.partial('level_2_partial');
			var level3 = tPartial.partial('level_3_partial');
			
			expect( typeof level1.render ).toBe( 'function' );
			expect( typeof level2.render ).toBe( 'function' );
			expect( typeof level3.render ).toBe( 'function' );
			
			var node1 = level1.render().childNodes[0];
			var node2 = level2.render().childNodes[0];
			var node3 = level3.render().childNodes[0];
			
			expect( node1.tagName.toLowerCase() ).toBe( 'div' );
			expect( node1.classList.contains('level1') ).toBe( true );
			expect( node2.tagName.toLowerCase() ).toBe( 'div' );
			expect( node2.classList.contains('level2') ).toBe( true );
			expect( node3.tagName.toLowerCase() ).toBe( 'div' );
			expect( node3.classList.contains('level3') ).toBe( true );
		});
		
		it('should allow inline text nodes', function() {
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 0).firstChild ).toHaveNodeType( document.TEXT_NODE );
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 0).firstChild ).toHaveTextContent('inline text');
			
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 0).childNodes[1] ).toHaveNodeType( document.ELEMENT_NODE );
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 0).childNodes[1].tagName.toLowerCase() ).toBe( 'div' );
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 0).childNodes[1].classList.contains('otherChild') ).toBe( true );
			
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 1).firstChild ).toHaveNodeType( document.TEXT_NODE );
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 1).firstChild ).toHaveTextContent('inline text');
			
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 2).firstChild ).toHaveNodeType( document.TEXT_NODE );
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 2).firstChild ).toHaveTextContent('inline text');
			
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 3).firstChild ).toHaveNodeType( document.TEXT_NODE );
			expect( renderAndGetNode(tInlineText, { variable: 'value' }, 3).firstChild ).toHaveTextContent('inline text value');
		});
	});
});
