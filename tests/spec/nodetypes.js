define([
	'ist!nodetypes/empty',
	'ist!nodetypes/textnode',
	'ist!nodetypes/elements'
], function(tEmpty, tTextNode, tElements) {
	return function() {
		var fragment = tEmpty.render(),
			textNodes = tTextNode.render().childNodes,
			elementNodes = tElements.render().childNodes;	
	
		it("should return a DocumentFragment in the rendering document", function() {
			expect( fragment ).toHaveNodeType( document.DOCUMENT_FRAGMENT_NODE );
			expect( fragment ).toBeInDocument( document );
		});
		
		it("should create text nodes in the rendering document", function() {
			expect( textNodes[0] ).toHaveNodeType( document.TEXT_NODE );
			expect( textNodes[0] ).toHaveTextContent("text node");
			expect( textNodes[0] ).toBeInDocument( document );
		});
		
		it("should support escaped characters", function() {
			expect( textNodes[1] ).toHaveTextContent("\"\n''\t\b\f\r\\\"");
		});
		
		it("should treat unknown escaped characters as non-escaped", function() {
			expect( textNodes[2] ).toHaveTextContent("azeQSD");
		});
		
		it("should allow all characters in text nodes", function() {
			expect( textNodes[3] ).toHaveTextContent("é€Ω");
		});
		
		it("should allow ASCII characters escaped as \\x??", function() {
			expect( textNodes[4] ).toHaveTextContent("éé9é99éXe9");
		});
		
		it("should allow Unicode characters escaped as \\u????", function() {
			expect( textNodes[5] ).toHaveTextContent("é€€€ΩU03a9");
		});
		
		it("should create text nodes from single-quoted text", function() {
			expect( textNodes[6] ).toHaveNodeType( document.TEXT_NODE );
			expect( textNodes[6] ).toHaveTextContent("text node");
			expect( textNodes[6] ).toBeInDocument( document );
		});
		
		it("should support escaped characters in single-quoted text", function() {
			expect( textNodes[7] ).toHaveTextContent('\'\n""\t\b\f\r\\\'');
		});
		
		it("should create element nodes in the rendering document", function() {
			expect( elementNodes[0] ).toHaveNodeType( document.ELEMENT_NODE );
			expect( elementNodes[0] ).toBeInDocument( document );
		});
		
		it("should create elements with the right tagName", function() {
			var tags = ['div', 'span', 'a', 'input', 'br'];
			
			Array.prototype.slice.call(elementNodes).forEach(function (node, index) {
				expect( node.tagName.toLowerCase() ).toBe( tags[index] );
			});
		});
	};
});
