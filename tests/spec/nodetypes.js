define([
	'ist!spec/nodetypes/empty',
	'ist!spec/nodetypes/textnode',
	'ist!spec/nodetypes/elements'
], function(tEmpty, tTextNode, tElements) {
	describe('nodetypes', function() {
		var fragment = tEmpty.render(),
			textNodes = tTextNode.render().childNodes,
			elementNodes = tElements.render().childNodes;	
	
		it("should return a DocumentFragment", function() {
			expect( fragment.toString().indexOf('DocumentFragment') ).toNotBe(-1);
		});
		
		it("should create text nodes", function() {
			expect( textNodes[0].nodeType ).toBe( document.TEXT_NODE );
			expect( textNodes[0].textContent ).toBe("text node");
		});
		
		it("should support a missing trailing double-quote", function() {
			expect( textNodes[1].nodeType ).toBe( document.TEXT_NODE );
			expect( textNodes[1].textContent ).toBe("text node");
		});
		
		it("should support literal double quotes", function() {
			expect( textNodes[2].textContent ).toBe("text \"node\"");
		});
		
		it("should create element nodes", function() {
			expect( elementNodes[0].nodeType ).toBe( document.ELEMENT_NODE );
		});
		
		it("should create elements with the right tagName", function() {
			var tags = ['div', 'span', 'a', 'input', 'br'];
			
			Array.prototype.slice.call(elementNodes).forEach(function (node, index) {
				expect( node.tagName.toLowerCase() ).toBe( tags[index] );
			});
		});
	});
});
