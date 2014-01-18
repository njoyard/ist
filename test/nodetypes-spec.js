/*jshint browser:true*/
/*global define, describe, it, expect, renderAndGetNode */

define([
	'ist!test/nodetypes/empty',
	'ist!test/nodetypes/textnode',
	'ist!test/nodetypes/elements'
], function(tEmpty, tTextNode, tElements) {
	'use strict';

	return function() {
		describe('[Node types]', function() {
			var fragment = tEmpty.render();
		
			it('should return a DocumentFragment in the rendering document', function() {
				expect( fragment ).toHaveNodeType( document.DOCUMENT_FRAGMENT_NODE );
				expect( fragment ).toBeInDocument( document );
			});
			
			it('should create text nodes in the rendering document', function() {
				expect( renderAndGetNode(tTextNode, null, 0) ).toHaveNodeType( document.TEXT_NODE );
				expect( renderAndGetNode(tTextNode, null, 0) ).toHaveTextContent('text node');
				expect( renderAndGetNode(tTextNode, null, 0) ).toBeInDocument( document );
			});
			
			it('should support escaped characters', function() {
				expect( renderAndGetNode(tTextNode, null, 1) ).toHaveTextContent('"\n\'\'\t\b\f\r\\"');
			});
			
			it('should treat unknown escaped characters as non-escaped', function() {
				expect( renderAndGetNode(tTextNode, null, 2) ).toHaveTextContent('azeQSD');
			});
			
			it('should allow all characters in text nodes', function() {
				expect( renderAndGetNode(tTextNode, null, 3) ).toHaveTextContent('é€Ω');
			});
			
			it('should allow ASCII characters escaped as \\x??', function() {
				expect( renderAndGetNode(tTextNode, null, 4) ).toHaveTextContent('éé9é99éXe9');
			});
			
			it('should allow Unicode characters escaped as \\u????', function() {
				expect( renderAndGetNode(tTextNode, null, 5) ).toHaveTextContent('é€€€ΩU03a9');
			});
			
			it('should create text nodes from single-quoted text', function() {
				expect( renderAndGetNode(tTextNode, null, 6) ).toHaveNodeType( document.TEXT_NODE );
				expect( renderAndGetNode(tTextNode, null, 6) ).toHaveTextContent('text node');
				expect( renderAndGetNode(tTextNode, null, 6) ).toBeInDocument( document );
			});
			
			it('should support escaped characters in single-quoted text', function() {
				expect( renderAndGetNode(tTextNode, null, 7) ).toHaveTextContent('\'\n""\t\b\f\r\\\'');
			});
			
			it('should create element nodes in the rendering document', function() {
				expect( renderAndGetNode(tElements, null, 0) ).toHaveNodeType( document.ELEMENT_NODE );
				expect( renderAndGetNode(tElements, null, 0) ).toBeInDocument( document );
			});
			
			it('should create elements with the right tagName', function() {
				var tags = ['div', 'span', 'a', 'input', 'br'];
				
				tags.forEach(function(tag, index) {
					expect( renderAndGetNode(tElements, null, index).tagName.toLowerCase() ).toBe(tag);
				});
			});
		});
	};
});
