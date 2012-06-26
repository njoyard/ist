define([
	'ist!nodetypes/empty',
	'ist!nodetypes/textnode',
	'ist!nodetypes/elements'
], function(tEmpty, tTextNode, tElements) {
	describe('nodetypes', function() {
		var fragment = tEmpty.render(),
			textNodes = tTextNode.render().childNodes,
			elementNodes = tElements.render().childNodes;	
	
		it("should return a DocumentFragment in the rendering document", function() {
			expect( fragment.nodeType ).toBe( document.DOCUMENT_FRAGMENT_NODE );
			expect( fragment.ownerDocument ).toBe( document );
		});
		
		it("should create text nodes in the rendering document", function() {
			expect( textNodes[0].nodeType ).toBe( document.TEXT_NODE );
			expect( textNodes[0].textContent ).toBe("text node");
			expect( textNodes[0].ownerDocument ).toBe( document );
		});
		
		it("should support a missing trailing double-quote", function() {
			expect( textNodes[1].nodeType ).toBe( document.TEXT_NODE );
			expect( textNodes[1].textContent ).toBe("text node");
		});
		
		it("should support literal double quotes", function() {
			expect( textNodes[2].textContent ).toBe("text \"node\"");
		});
		
		it("should create element nodes in the rendering document", function() {
			expect( elementNodes[0].nodeType ).toBe( document.ELEMENT_NODE );
			expect( elementNodes[0].ownerDocument ).toBe( document );
		});
		
		it("should create elements with the right tagName", function() {
			var tags = ['div', 'span', 'a', 'input', 'br'];
			
			Array.prototype.slice.call(elementNodes).forEach(function (node, index) {
				expect( node.tagName.toLowerCase() ).toBe( tags[index] );
			});
		});
	});
});
